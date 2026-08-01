const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const { createClient } = require("redis");
const { randomUUID } = require("crypto");
const User = require("./models/userModel");
const { isAllowedOrigin } = require("./utils/corsConfig");

let waitingPlayersPerLeague = {};
const activeGames = {};
const disconnectTimers = new Map();

const GAME_TTL_SECONDS = Number(process.env.GAME_TTL_SECONDS || 7200);
const WAITING_TTL_SECONDS = Number(process.env.WAITING_TTL_SECONDS || 120);
const LOCK_TTL_MS = Number(process.env.LOCK_TTL_MS || 4000);
const LOCK_RETRY_DELAY_MS = Number(process.env.LOCK_RETRY_DELAY_MS || 40);
const LOCK_MAX_RETRIES = Number(process.env.LOCK_MAX_RETRIES || 50);

let sharedStateClient = null;

const getGameKey = (roomId) => `socket:game:${roomId}`;
const getWaitingKey = (leagueId) => `socket:waiting:${leagueId}`;
const getUserRoomKey = (userId) => `socket:user-room:${userId}`;
const getLockKey = (scope, id) => `socket:lock:${scope}:${id}`;
const getDisconnectTimerKey = (roomId, userId) => `${roomId}:${userId}`;

const compareAndDeleteScript = `
  if redis.call("GET", KEYS[1]) == ARGV[1] then
    return redis.call("DEL", KEYS[1])
  end
  return 0
`;

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function compareAndDelete(key, expectedValue) {
  if (!sharedStateClient) return 0;

  return sharedStateClient.eval(compareAndDeleteScript, {
    keys: [key],
    arguments: [expectedValue],
  });
}

async function acquireLock(lockKey) {
  if (!sharedStateClient) return null;

  const token = randomUUID();

  for (let attempt = 0; attempt < LOCK_MAX_RETRIES; attempt += 1) {
    const result = await sharedStateClient.set(lockKey, token, {
      NX: true,
      PX: LOCK_TTL_MS,
    });

    if (result === "OK") {
      return token;
    }

    await sleep(LOCK_RETRY_DELAY_MS);
  }

  return null;
}

async function releaseLock(lockKey, token) {
  if (!sharedStateClient || !token) return;
  await compareAndDelete(lockKey, token);
}

async function withRedisLock(scope, id, fn) {
  if (!id || !sharedStateClient) {
    return fn();
  }

  const lockKey = getLockKey(scope, id);
  const lockToken = await acquireLock(lockKey);
  if (!lockToken) {
    throw new Error(`Failed to acquire lock for ${scope}:${id}`);
  }

  try {
    return await fn();
  } finally {
    await releaseLock(lockKey, lockToken);
  }
}

async function getGame(roomId) {
  if (!roomId) return null;

  if (!sharedStateClient) {
    return activeGames[roomId] || null;
  }

  const raw = await sharedStateClient.get(getGameKey(roomId));
  if (!raw) return null;
  return JSON.parse(raw);
}

async function setGame(roomId, game, ttlSeconds = GAME_TTL_SECONDS) {
  if (!roomId || !game) return;

  if (!sharedStateClient) {
    activeGames[roomId] = game;
    return;
  }

  await sharedStateClient.set(getGameKey(roomId), JSON.stringify(game), {
    EX: ttlSeconds,
  });
}

async function deleteGame(roomId) {
  if (!roomId) return;

  if (!sharedStateClient) {
    delete activeGames[roomId];
    return;
  }

  await sharedStateClient.del(getGameKey(roomId));
}

async function getWaitingPlayer(leagueId) {
  if (!leagueId) return null;

  if (!sharedStateClient) {
    return waitingPlayersPerLeague[leagueId] || null;
  }

  const raw = await sharedStateClient.get(getWaitingKey(leagueId));
  if (!raw) return null;
  return JSON.parse(raw);
}

async function setWaitingPlayerIfEmpty(leagueId, waitingData) {
  if (!leagueId || !waitingData) return false;

  if (!sharedStateClient) {
    if (waitingPlayersPerLeague[leagueId]) return false;
    waitingPlayersPerLeague[leagueId] = waitingData;
    return true;
  }

  const result = await sharedStateClient.set(
    getWaitingKey(leagueId),
    JSON.stringify(waitingData),
    {
      EX: WAITING_TTL_SECONDS,
      NX: true,
    },
  );

  return result === "OK";
}

async function clearWaitingPlayer(leagueId, socketId) {
  if (!leagueId) return;

  if (!sharedStateClient) {
    if (
      waitingPlayersPerLeague[leagueId] &&
      waitingPlayersPerLeague[leagueId].socketId === socketId
    ) {
      delete waitingPlayersPerLeague[leagueId];
    }
    return;
  }

  const waitingKey = getWaitingKey(leagueId);
  const waiting = await sharedStateClient.get(waitingKey);
  if (!waiting) return;

  const parsedWaiting = JSON.parse(waiting);
  if (parsedWaiting.socketId === socketId) {
    await compareAndDelete(waitingKey, waiting);
  }
}

async function setUserRoom(userId, roomId, ttlSeconds = GAME_TTL_SECONDS) {
  if (!userId || !roomId) return;

  if (!sharedStateClient) return;

  await sharedStateClient.set(getUserRoomKey(userId), roomId, {
    EX: ttlSeconds,
  });
}

async function getUserRoom(userId) {
  if (!userId) return null;

  if (!sharedStateClient) return null;

  return sharedStateClient.get(getUserRoomKey(userId));
}

async function clearUserRoom(userId, roomId) {
  if (!userId) return;

  if (!sharedStateClient) return;

  const userRoomKey = getUserRoomKey(userId);
  const current = await sharedStateClient.get(userRoomKey);
  if (!current || (roomId && current !== roomId)) return;
  await compareAndDelete(userRoomKey, current);
}

async function resolveRoomId(socket) {
  if (socket.data.roomId) return socket.data.roomId;

  const roomId = await getUserRoom(socket.data.userId);
  if (roomId) {
    socket.data.roomId = roomId;
  }

  return roomId;
}

function clearDisconnectTimer(roomId, userId) {
  const key = getDisconnectTimerKey(roomId, userId);
  const timer = disconnectTimers.get(key);
  if (!timer) return;
  clearTimeout(timer);
  disconnectTimers.delete(key);
}

async function configureRedisAdapter(io) {
  const redisUrl = process.env.REDIS_URL;
  const redisHost = process.env.REDIS_HOST;
  const redisPort = process.env.REDIS_PORT || "6379";

  if (!redisUrl && !redisHost) {
    console.warn(
      "Redis config not provided. Socket.IO runs in single-node mode.",
    );
    return;
  }

  const connectionUrl = redisUrl || `redis://${redisHost}:${redisPort}`;

  const pubClient = createClient({ url: connectionUrl });
  const subClient = pubClient.duplicate();

  pubClient.on("error", (err) => {
    console.error("Socket Redis pub client error:", err.message);
  });
  subClient.on("error", (err) => {
    console.error("Socket Redis sub client error:", err.message);
  });

  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));
  sharedStateClient = pubClient;
  console.log("Socket.IO Redis adapter enabled");
}

async function initializeSocketServer(server) {
  const io = new Server(server, {
    cors: {
      origin(origin, callback) {
        if (isAllowedOrigin(origin)) return callback(null, true);
        return callback(new Error(`Socket CORS blocked for origin: ${origin}`));
      },
      methods: ["GET", "POST"],
      credentials: true,
    },
    // Adaugă setări pentru compatibilitate
    allowEIO3: true,
    cookie: true,
  });

  try {
    await configureRedisAdapter(io);
  } catch (error) {
    console.error(
      "Failed to initialize Socket.IO Redis adapter:",
      error.message,
    );
    if (process.env.NODE_ENV === "production") {
      throw error;
    }
    console.warn("Continuing without Redis adapter in non-production mode");
  }

  function checkWinner(board) {
    const lines = [
      [
        [0, 0],
        [0, 1],
        [0, 2],
      ],
      [
        [1, 0],
        [1, 1],
        [1, 2],
      ],
      [
        [2, 0],
        [2, 1],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      [
        [0, 1],
        [1, 1],
        [2, 1],
      ],
      [
        [0, 2],
        [1, 2],
        [2, 2],
      ],
      [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
      [
        [0, 2],
        [1, 1],
        [2, 0],
      ],
    ];

    for (const line of lines) {
      const [a, b, c] = line;
      const aCell = board[a[0]][a[1]];
      const bCell = board[b[0]][b[1]];
      const cCell = board[c[0]][c[1]];

      if (
        aCell.symbol &&
        aCell.symbol === bCell.symbol &&
        aCell.symbol === cCell.symbol
      ) {
        return {
          symbol: aCell.symbol,
          player: aCell.player,
          line: line,
        };
      }
    }
    return null;
  }

  io.on("connection", async (socket) => {
    const {
      leagueId,
      userId,
      mode,
      roomId: handshakeRoomId,
    } = socket.handshake.query;

    // Validare conexiune
    if (!leagueId || !userId || typeof userId !== "string") {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    socket.data.leagueId = leagueId;

    // Handler reconectare
    socket.on("reconnect_game", async ({ roomId }) => {
      const game = await getGame(roomId);
      if (game && (game.players.X === userId || game.players.O === userId)) {
        socket.join(roomId);
        socket.data.roomId = roomId;
        await setUserRoom(userId, roomId);
        socket.emit("game_state", game);
      }
    });

    socket.on("turn_timeout", async () => {
      const roomId = await resolveRoomId(socket);
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (!game || game.finished) return;

        // Dacă e faza de mutări pe grid
        if (
          game.teamSelections.rows.every((x) => x) &&
          game.teamSelections.cols.every((x) => x)
        ) {
          // Schimbă tura
          game.nextTurn = game.nextTurn === "X" ? "O" : "X";
          io.to(roomId).emit("update_board", {
            nextTurn: game.nextTurn,
          });
        } else {
          // Faza de selecție echipe
          game.teamTurn = game.teamTurn === "X" ? "O" : "X";
          io.to(roomId).emit("update_team_turn", {
            nextTurn: game.teamTurn,
          });
        }

        await setGame(roomId, game);
      });
    });

    // Handler selectie echipa
    socket.on("select_item", async ({ type, index, item }) => {
      const roomId = await resolveRoomId(socket);
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (!game) return;

        const playerSymbol = game.players.X === userId ? "X" : "O";
        if (game.teamTurn !== playerSymbol) return;

        const selectionType = type === "row" ? "rows" : "cols";

        // Verificare duplicat
        const alreadySelected = [
          ...game.teamSelections.rows,
          ...game.teamSelections.cols,
        ].some(
          (existingItem, i) =>
            existingItem &&
            i !== index &&
            existingItem.type === item.type &&
            existingItem.data.name === item.data.name,
        );

        if (alreadySelected) return; // Ignoră dacă item-ul este deja ales

        if (game.teamSelections[selectionType][index] !== null) return;

        game.teamSelections[selectionType][index] = item;
        game.teamTurn = playerSymbol === "X" ? "O" : "X";

        await setGame(roomId, game);
        io.to(roomId).emit("update_team_state", game.teamSelections);
        io.to(roomId).emit("update_team_turn", { nextTurn: game.teamTurn });
      });
    });

    // Private room (invite) support
    socket.on("create_private_room", async ({ league, userId }) => {
      const roomId = `priv-${socket.id}-${Date.now()}`;
      socket.join(roomId);
      socket.data.roomId = roomId;
      const game = {
        board: Array(3)
          .fill()
          .map(() =>
            Array(3)
              .fill()
              .map(() => ({ player: null, symbol: null, team: null })),
          ),
        nextTurn: "X",
        teamTurn: "X",
        players: {
          X: userId,
          O: null,
        },
        teamSelections: {
          rows: Array(3).fill(null),
          cols: Array(3).fill(null),
        },
        invite: true,
        status: "open", // open | started
        createdAt: Date.now(),
        expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes TTL
        creatorId: userId,
        leagueId: league,
      };

      await setGame(roomId, game, 600);
      await setUserRoom(userId, roomId, 600);
      socket.emit("private_room_created", { roomId });
    });

    socket.on("cancel_private_room", async ({ roomId }) => {
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (game && game.invite) {
          await deleteGame(roomId);
          socket.leave(roomId);
        }
      });
    });

    socket.on("join_private_room", async ({ roomId, league, userId }) => {
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);

        // Basic existence and invite validity
        if (!game || !game.invite) {
          return socket.emit("invite_invalid", { reason: "not_found" });
        }

        // League mismatch guard (optional, only if sent)
        if (league && game.leagueId && game.leagueId !== league) {
          return socket.emit("invite_invalid", { reason: "wrong_league" });
        }

        // Expiration check
        if (game.expiresAt && Date.now() > game.expiresAt) {
          await deleteGame(roomId);
          return socket.emit("invite_invalid", { reason: "expired" });
        }

        const roomSockets = await io.in(roomId).fetchSockets();
        const creatorOnline = roomSockets.some(
          (roomSocket) => roomSocket.data.userId === game.players.X,
        );

        // Self-join not allowed for initial join
        const isCreator = userId === game.players.X;

        if (game.status === "open") {
          if (!creatorOnline) {
            return socket.emit("invite_invalid", {
              reason: "creator_not_waiting",
            });
          }
          if (isCreator) {
            return socket.emit("invite_invalid", { reason: "self_join" });
          }
          // Accept the opponent
          if (!game.players.O) game.players.O = userId;
          // Mark started once opponent joins
          game.status = "started";
        } else if (game.status === "started") {
          // Allow only participants to rejoin
          if (userId !== game.players.X && userId !== game.players.O) {
            return socket.emit("invite_invalid", { reason: "already_started" });
          }
        }

        socket.join(roomId);
        socket.data.roomId = roomId;
        await setUserRoom(userId, roomId, game.invite ? 600 : GAME_TTL_SECONDS);

        // If user had a pending disconnect timer (page navigation), clear it
        clearDisconnectTimer(roomId, userId);

        await setGame(roomId, game, game.invite ? 600 : GAME_TTL_SECONDS);

        // notify both
        const symbols = {};
        const roomMembers = await io.in(roomId).fetchSockets();
        roomMembers.forEach((roomSocket) => {
          symbols[roomSocket.id] =
            roomSocket.data.userId === game.players.X ? "X" : "O";
        });

        io.to(roomId).emit("start_game", {
          roomId,
          symbols,
          initialTeamTurn: game.teamTurn,
          initialSelections: game.teamSelections,
        });

        // let creator know opponent joined (only when opening)
        io.to(roomId).emit("opponent_joined", { roomId });
      });
    });

    // No auto-join via handshake; clients explicitly call join_private_room

    // Matchmaking (skip when invite mode)
    if (mode === "invite") {
      // do not enter public matchmaking pool
    } else {
      try {
        await withRedisLock("league", leagueId, async () => {
          const waitingPlayer = await getWaitingPlayer(leagueId);

          if (waitingPlayer && waitingPlayer.socketId !== socket.id) {
            const roomId = `${waitingPlayer.socketId}-${socket.id}`;

            await clearWaitingPlayer(leagueId, waitingPlayer.socketId);

            const game = {
              board: Array(3)
                .fill()
                .map(() =>
                  Array(3)
                    .fill()
                    .map(() => ({ player: null, symbol: null, team: null })),
                ),
              nextTurn: "X",
              teamTurn: "X",
              players: {
                X: waitingPlayer.userId,
                O: socket.data.userId,
              },
              teamSelections: {
                rows: Array(3).fill(null),
                cols: Array(3).fill(null),
              },
              invite: false,
            };

            await setGame(roomId, game);

            socket.join(roomId);
            socket.data.roomId = roomId;
            socket.data.opponentSocketId = waitingPlayer.socketId;
            await setUserRoom(socket.data.userId, roomId);
            await setUserRoom(waitingPlayer.userId, roomId);

            io.to(waitingPlayer.socketId).socketsJoin(roomId);
            io.to(waitingPlayer.socketId).emit("assign_room", {
              roomId,
              opponentSocketId: socket.id,
            });

            io.to(roomId).emit("start_game", {
              roomId,
              symbols: { [waitingPlayer.socketId]: "X", [socket.id]: "O" },
              initialTeamTurn: "X",
              initialSelections: game.teamSelections,
            });
          } else {
            await setWaitingPlayerIfEmpty(leagueId, {
              socketId: socket.id,
              userId: socket.data.userId,
              createdAt: Date.now(),
            });
          }
        });
      } catch (error) {
        console.error("Matchmaking lock error:", error.message);
      }
    }

    // Adăugăm în handler-ul 'connection'
    socket.on("invalid_move", async () => {
      const roomId = await resolveRoomId(socket);
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (!game) return;

        // Schimbă rândul
        game.nextTurn = game.nextTurn === "X" ? "O" : "X";

        // Notifică toți jucătorii
        io.to(roomId).emit("update_board", {
          nextTurn: game.nextTurn,
        });

        await setGame(roomId, game);
      });
    });

    // Adaugă acest handler în interiorul io.on('connection', ...)
    socket.on("skip_turn", async ({ phase }) => {
      const roomId = await resolveRoomId(socket);
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (!game) return;

        if (phase === "team_selection") {
          // Schimbă turul la selecția de echipe
          game.teamTurn = game.teamTurn === "X" ? "O" : "X";
          io.to(roomId).emit("update_team_turn", {
            nextTurn: game.teamTurn,
          });
        } else {
          // Schimbă turul la jocul principal
          game.nextTurn = game.nextTurn === "X" ? "O" : "X";
          io.to(roomId).emit("update_board", {
            nextTurn: game.nextTurn,
          });
        }

        await setGame(roomId, game);
      });
    });
    // Add to connection handler
    socket.on("offer_draw", async () => {
      const roomId = await resolveRoomId(socket);
      const game = await getGame(roomId);
      if (!game) return;

      // Forward draw offer to opponent
      socket.to(roomId).emit("draw_offered");
    });

    socket.on("respond_draw", async ({ accepted }) => {
      const roomId = await resolveRoomId(socket);
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (!game) return;

        if (accepted) {
          // For invite games, do not update user stats
          if (!game.invite) {
            await User.findByIdAndUpdate(game.players.X, {
              $inc: { numberOfMatches: 1 },
            });
            await User.findByIdAndUpdate(game.players.O, {
              $inc: { numberOfMatches: 1 },
            });
          }
          // Both players agreed to draw
          io.to(roomId).emit("draw_accepted");
          await deleteGame(roomId);
          await Promise.all([
            clearUserRoom(game.players.X, roomId),
            clearUserRoom(game.players.O, roomId),
          ]);
        } else {
          // Notify offering player that draw was declined
          socket.to(roomId).emit("draw_declined");

          // Corrected: Set turn to the player who declined
          const declinerSymbol =
            game.players.X === socket.data.userId ? "X" : "O";
          game.nextTurn = declinerSymbol;

          io.to(roomId).emit("update_board", {
            nextTurn: declinerSymbol,
          });

          await setGame(roomId, game);
        }
      });
    });

    // Handler mutare
    socket.on("make_move", async ({ row, col, player, selectedPlayer }) => {
      const roomId = await resolveRoomId(socket);
      if (!roomId) return;

      await withRedisLock("room", roomId, async () => {
        const game = await getGame(roomId);
        if (!game) return;

        // Determină simbolul jucătorului curent după userId
        const playerSymbol = game.players.X === socket.data.userId ? "X" : "O";

        // Validări: este rândul lui? Este celula liberă? Au fost făcute selecțiile?
        if (
          game.nextTurn !== playerSymbol ||
          game.board[row][col].symbol !== null ||
          game.teamSelections.rows.some((x) => x === null) ||
          game.teamSelections.cols.some((x) => x === null)
        ) {
          // Schimbă automat rândul pentru mutări invalide
          game.nextTurn = playerSymbol === "X" ? "O" : "X";
          await setGame(roomId, game);
          io.to(roomId).emit("update_board", { nextTurn: game.nextTurn });
          return socket.emit(
            "move_error",
            "Invalid move - turn passed to opponent",
          );
        }

        // Actualizează board-ul folosind simbolul determinat pe server
        game.board[row][col] = {
          player: socket.data.userId,
          symbol: playerSymbol,
          team: selectedPlayer,
        };

        // Schimbă tura
        game.nextTurn = playerSymbol === "X" ? "O" : "X";

        io.to(roomId).emit("update_board", {
          row,
          col,
          player: playerSymbol,
          selectedPlayer,
          nextTurn: game.nextTurn, // adaugă asta
        });

        // Verifica castigator
        const winner = checkWinner(game.board);
        if (winner) {
          // Update baza de date
          if (!game.invite) {
            try {
              await User.findByIdAndUpdate(winner.player, {
                $inc: { numberOfMatches: 1, numberOfWins: 1 },
              });
              await User.findByIdAndUpdate(
                winner.player === game.players.X
                  ? game.players.O
                  : game.players.X,
                { $inc: { numberOfMatches: 1 } },
              );
            } catch (error) {
              console.error("DB update error:", error);
            }
          }

          io.to(roomId).emit("game_won", {
            winner: winner.player,
            winningLine: winner.line,
          });
          await deleteGame(roomId);
          await Promise.all([
            clearUserRoom(game.players.X, roomId),
            clearUserRoom(game.players.O, roomId),
          ]);
          return;
        }

        // Verifica remiza
        if (game.board.flat().every((cell) => cell.symbol !== null)) {
          if (!game.invite) {
            try {
              await User.findByIdAndUpdate(game.players.X, {
                $inc: { numberOfMatches: 1 },
              });
              await User.findByIdAndUpdate(game.players.O, {
                $inc: { numberOfMatches: 1 },
              });
            } catch (error) {
              console.error("DB update error:", error);
            }
          }

          io.to(roomId).emit("game_draw");
          await deleteGame(roomId);
          await Promise.all([
            clearUserRoom(game.players.X, roomId),
            clearUserRoom(game.players.O, roomId),
          ]);
          return;
        }

        await setGame(roomId, game);
      });
    });

    // Handler deconectare
    socket.on("disconnect", async () => {
      const roomId = await resolveRoomId(socket);
      const leavingUserId = socket.data.userId;

      const finalize = async () => {
        if (!roomId) return;

        await withRedisLock("room", roomId, async () => {
          const currentGame = await getGame(roomId);
          if (!currentGame || currentGame.finished) return;

          // If same user still has another socket in room, do nothing
          const socketsInRoom = await io.in(roomId).fetchSockets();
          for (const roomSocket of socketsInRoom) {
            if (roomSocket.data.userId === leavingUserId) {
              return; // user reconnected
            }
          }

          currentGame.finished = true;
          const opponentId =
            currentGame.players[
              leavingUserId === currentGame.players.X ? "O" : "X"
            ];

          if (!opponentId) {
            // No opponent yet (e.g., invite room before friend joined). Just close the game silently.
            await deleteGame(roomId);
            await clearUserRoom(leavingUserId, roomId);
            return;
          }

          if (!currentGame.invite) {
            try {
              await User.findByIdAndUpdate(opponentId, {
                $inc: { numberOfWins: 1, numberOfMatches: 1 },
              });
              await User.findByIdAndUpdate(leavingUserId, {
                $inc: { numberOfMatches: 1 },
              });
            } catch (error) {
              console.error("DB update error:", error);
            }
          }

          io.to(roomId).emit("opponent_disconnected", { winner: opponentId });
          await deleteGame(roomId);
          await Promise.all([
            clearUserRoom(leavingUserId, roomId),
            clearUserRoom(opponentId, roomId),
          ]);
        });
      };

      if (roomId) {
        const game = await getGame(roomId);

        if (game && !game.finished) {
          // If it's an invite room and the creator leaves before anyone joined, invalidate the link immediately.
          if (
            game.invite &&
            game.players &&
            game.players.X === socket.data.userId &&
            !game.players.O
          ) {
            await withRedisLock("room", roomId, async () => {
              await deleteGame(roomId);
              await clearUserRoom(socket.data.userId, roomId);
            });
          } else if (game.invite) {
            // Provide a small grace period for invite games to allow navigation/reconnect
            const timer = setTimeout(finalize, 3000);
            disconnectTimers.set(
              getDisconnectTimerKey(roomId, leavingUserId),
              timer,
            );
          } else {
            await finalize();
          }
        }
      }

      // Curata lista de asteptare
      await clearWaitingPlayer(socket.data.leagueId, socket.id);
    });
  });

  return io;
}

module.exports = initializeSocketServer;
