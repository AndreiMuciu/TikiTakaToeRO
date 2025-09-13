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

exports.updateMe = async (req, res, next) => {
  try {
    if (req.body.password || req.body.passwordConfirm) {
      return res.status(400).json({
        status: "fail",
        message:
          "This route is not for password updates. Please use /updateMyPassword.",
      });
    }

    const filteredBody = {
      username: req.body.username,
      email: req.body.email,
    };

    actualUser = await User.findById(req.user.id);

    if (actualUser.googleId) {
      // If the user registered via Google, prevent email changes
      if (req.body.email && req.body.email !== actualUser.email) {
        return res.status(400).json({
          status: "fail",
          message:
            "This user registered with Google. Email changes are not allowed.",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      filteredBody,
      {
        new: true,
        runValidators: true,
      }
    );

    if (actualUser.email !== req.body.email) {
      // If the email has changed, mark the user as needing email verification
      updatedUser.isEmailVerified = false;
      await updatedUser.save({ validateBeforeSave: false });
    }

    return res.status(200).json({
      status: "success",
      data: {
        user: updatedUser,
      },
    });
  } catch (err) {
    return res.status(400).json({
      status: "fail",
      message: err.message,
    });
  }
};
