const teamController = require("../controllers/teamController");
const express = require("express");

const router = express.Router();

router.get("/by-ids", teamController.getTeamsByIds);

router
  .route("/")
  .get(teamController.getAllTeams)
  .post(teamController.createTeam);

router
  .route("/:id")
  .get(teamController.getTeam)
  .patch(teamController.updateTeam)
  .delete(teamController.deleteTeam);

module.exports = router;
