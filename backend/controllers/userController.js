const User = require("../models/userModel");
const factory = require("./handleFactory");

// We shouldn't create users through this controller, so we don't need to implement the createUser function here. Use signup !!!
// exports.createUser = factory.createOne(User);
exports.getAllUsers = factory.getAll(User);
exports.getUser = factory.getOne(User);
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { active: false });

    return res.status(204).json({
      status: "success",
      data: null,
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};

exports.getMe = async (req, res, next) => {
  return res.status(200).json({
    status: "success",
    data: {
      user: req.user,
    },
  });
};
