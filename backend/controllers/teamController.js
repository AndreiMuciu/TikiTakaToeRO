const Team = require("../models/teamModel");
const factory = require("./handleFactory");

exports.getAllTeams = factory.getAll(Team);
exports.getTeam = factory.getOne(Team);
exports.createTeam = factory.createOne(Team);
exports.updateTeam = factory.updateOne(Team);
exports.deleteTeam = factory.deleteOne(Team);

exports.getTeamsByIds = async (req, res) => {
  try {
    const ids = req.query.ids.split(",");
    const teams = await Team.find({ _id: { $in: ids } });

    if (!teams || teams.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "No teams found with the provided IDs.",
      });
    }

    res.status(200).json({
      status: "success",
      data: {
        teams,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "fail",
      message: err.message,
    });
  }
};
