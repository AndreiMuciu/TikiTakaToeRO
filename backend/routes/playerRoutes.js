const express = require("express");
const playerController = require("./../controllers/playerController");
const authController = require("../controllers/authController");

const router = express.Router();

router.get(
  "/played-for-two-teams",
  playerController.getPlayersPlayedForTwoTeams,
);

router.get(
  "/played-for-team-and-nationality",
  playerController.getPlayersPlayedForTeamWithNationality,
);

router.get("/search", playerController.searchPlayers);

router
  .route("/")
  .get(playerController.getAllPlayers)
  .post(
    authController.protect,
    authController.verifyCsrf,
    authController.restrictTo("admin"),
    playerController.createPlayer,
  );

router
  .route("/:id")
  .get(playerController.getPlayer)
  .patch(
    authController.protect,
    authController.verifyCsrf,
    authController.restrictTo("admin"),
    playerController.updatePlayer,
  )
  .delete(
    authController.protect,
    authController.verifyCsrf,
    authController.restrictTo("admin"),
    playerController.deletePlayer,
  );

module.exports = router;
