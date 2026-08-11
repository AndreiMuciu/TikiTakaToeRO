const teamController = require("../controllers/teamController");
const express = require("express");
const authController = require("../controllers/authController");

const router = express.Router();

router.get("/by-ids", teamController.getTeamsByIds);

router
  .route("/")
  .get(teamController.getAllTeams)
  .post(
    authController.protect,
    authController.verifyCsrf,
    authController.restrictTo("admin"),
    teamController.createTeam,
  );

router
  .route("/:id")
  .get(teamController.getTeam)
  .patch(
    authController.protect,
    authController.verifyCsrf,
    authController.restrictTo("admin"),
    teamController.updateTeam,
  )
  .delete(
    authController.protect,
    authController.verifyCsrf,
    authController.restrictTo("admin"),
    teamController.deleteTeam,
  );

module.exports = router;
