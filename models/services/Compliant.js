const mongoose = require("mongoose");
const { check } = require("express-validator");

const compliantSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,

    title: {
      type: String,
      required: true,
    },

    details: {
      type: String,
    },

    file_links: {
      type: Array,
      default: [],
    },

    creator_user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

const Compliant = mongoose.model("compliants", compliantSchema);
exports.Compliant = Compliant;

// validation

exports.CompliantValidator = [
  check("title")
    .isLength({ min: 5, max: 20 })
    .withMessage("Title must be at least 5 characters long"),
  check("details")
    .isLength({ min: 5 })
    .withMessage("Details must be at least 5 characters long"),
];
