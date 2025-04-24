const express = require("express");
const playerController = require("./../controllers/playerController");

const router = express.Router();

router.get(
  "/played-for-two-teams",
  playerController.getPlayersPlayedForTwoTeams
);

router.get(
  "/played-for-team-and-nationality",
  playerController.getPlayersPlayedForTeamWithNationality
);

router.get("/search", playerController.searchPlayers);

router
  .route("/")
  .get(playerController.getAllPlayers)
  .post(playerController.createPlayer);

router
  .route("/:id")
  .get(playerController.getPlayer)
  .patch(playerController.updatePlayer)
  .delete(playerController.deletePlayer);

module.exports = router;
