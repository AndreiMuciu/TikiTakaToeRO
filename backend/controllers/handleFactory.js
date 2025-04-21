const APIFeatures = require("../utils/APIFeatures");

exports.getAll = (Model) => {
  return async (req, res) => {
    try {
      const features = new APIFeatures(Model.find(), req.query)
        .filter()
        .sort()
        .limitFields()
        .paginate();
      const docs = await features.query;

      res.status(200).json({
        status: "success",
        results: docs.length,
        data: {
          data: docs,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };
};

exports.getOne = (Model) => {
  return async (req, res) => {
    try {
      const doc = await Model.findById(req.params.id);

      if (!doc) {
        return res.status(404).json({
          status: "fail",
          message: "No document found with that ID",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };
};

exports.createOne = (Model) => {
  return async (req, res) => {
    try {
      const doc = await Model.create(req.body);

      res.status(201).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(400).json({
        status: "fail",
        message: "Invalid data sent",
      });
    }
  };
};

exports.updateOne = (Model) => {
  return async (req, res) => {
    try {
      const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });

      if (!doc) {
        return res.status(404).json({
          status: "fail",
          message: "No document found with that ID",
        });
      }

      res.status(200).json({
        status: "success",
        data: {
          data: doc,
        },
      });
    } catch (err) {
      console.error(err);
    }
  };
};

exports.deleteOne = (Model) => {
  return async (req, res) => {
    try {
      const doc = await Model.findByIdAndDelete(req.params.id);

      if (!doc) {
        return res.status(404).json({
          status: "fail",
          message: "No document found with that ID",
        });
      }

      res.status(204).json({
        status: "success",
        data: null,
      });
    } catch (err) {
      console.error(err);
    }
  };
};
