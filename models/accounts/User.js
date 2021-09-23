const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { check } = require("express-validator");

//user schema
const UserSchema = new mongoose.Schema(
  {
    _id: mongoose.Schema.Types.ObjectId,

    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    phone_number: {
      type: String,
    },
    address: {
      type: String,
    },
    sex: {
      type: String,
      enum: ["Male", "Female"],
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      default: "Basic",
      enum: ["Basic", "Admin"],
    },
    account_state: {
      type: String,
      default: "Unblocked",
      enum: ["Unblocked", "Blocked"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

UserSchema.methods.generateAuthToken = function (user) {
  const token = jwt.sign({ user: user }, process.env.APP_SECRET_KEY);
  return token;
};

const User = mongoose.model("User", UserSchema);

exports.User = User;

// validation

exports.UserValidator = [
  check("name")
    .isLength({ min: 5, max: 100 })
    .withMessage("Name must be at least 5 characters long"),

  check("email").isEmail().withMessage("Email must be valid."),

  check("password")
    .isLength({ min: 5, max: 20 })
    .withMessage("Password must have a length in between 5 to 20."),

  check("address")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be atleast 5 character long"),

  check("sex")
    .optional()
    .isIn(["Male", "Female"])
    .withMessage("Sex must be either Male or Female."),
];

exports.UserUpdateValidator = [
  check("name")
    .isLength({ min: 5, max: 100 })
    .withMessage("Name must be at least 5 characters long"),

  check("email").isEmail().withMessage("Email must be valid."),

  check("address")
    .optional()
    .isLength({ min: 5, max: 200 })
    .withMessage("Address must be atleast 5 character long"),

  check("sex")
    .optional()
    .isIn(["Male", "Female"])
    .withMessage("Sex must be either Male or Female."),
];

exports.LoginValidator = [
  check("email").isEmail().withMessage("Email must be valid."),

  check("password").exists().withMessage("Password is required"),
];
