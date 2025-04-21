const Player = require("../models/playerModel");
const factory = require("./handleFactory");

exports.getAllPlayers = factory.getAll(Player);
exports.getPlayer = factory.getOne(Player);
exports.createPlayer = factory.createOne(Player);
exports.updatePlayer = factory.updateOne(Player);
exports.deletePlayer = factory.deleteOne(Player);

exports.getPlayersPlayedForTwoTeams = async (req, res, next) => {
  try {
    const { team1, team2 } = req.query;
    if (!team1 || !team2) {
      return res.status(400).json({
        status: "fail",
        message: "Please provide two teams",
      });
    }
    const players = await Player.find({
      teams: { $all: [team1, team2] }, // Căutăm jucători care au ambele echipe
    });
    if (players.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No players found for the provided teams",
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        players,
      },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
