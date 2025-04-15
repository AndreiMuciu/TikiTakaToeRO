const Player = require("../models/playerModel");
const factory = require("./handleFactory");

exports.getAllPlayers = factory.getAll(Player);
exports.getPlayer = factory.getOne(Player);
exports.createPlayer = factory.createOne(Player);
exports.updatePlayer = factory.updateOne(Player);
exports.deletePlayer = factory.deleteOne(Player);
