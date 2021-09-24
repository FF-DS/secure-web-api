const mongoose = require("mongoose");
const { User } = require("../../models/accounts/User");
const bcrypt = require("bcrypt");
const { Token } = require("../../models/accounts/Token");
const { validationResult } = require("express-validator");
const jwt = require("jsonwebtoken");
const cloudinary = require("cloudinary").v2;

exports.get_current_user = async (req, res) => {
  let user = await User.findById(req.user._id);
  user.password = "";

  return res.send(user);
};

exports.log_in = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.mapped());
  }

  let user = await User.findOne({ email: req.body.email });

  if (!user)
    return res.status(403).send({
      email: {
        value: req.body.email,
        msg: "Invalid email or password.",
        param: "email",
      },
    });

  let result = await bcrypt.compare(req.body.password, user.password);

  if (!result) {
    if (user.account_trial == 0) {
      user.account_state = "Blocked";
      await user.save();
    }

    return res.status(403).send({
      email: {
        value: req.body.email,
        msg: "Invalid email or password. ",
        param: "email",
      },
    });
  }

  if (user.account_state == "Blocked")
    return res.status(401).send({
      email: {
        value: req.body.email,
        msg: "Sorry it seems your account has been suspended, please contact us to solve this issue.",
        param: "email",
      },
    });

  user.account_trial = 3;
  await user.save();

  const token = user.generateAuthToken(user);
  user.password = "";
  return res.send({ user: user, token: token });
};

exports.change_password = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.mapped());
  }

  try {
    let user = await User.findById(req.user._id);
    let result = await bcrypt.compare(req.body.old_password, user.password);

    if (!result)
      return res.status(403).send({
        password: {
          value: req.body.old_password,
          msg: "Password is not correct. Please try again.",
          param: "password",
        },
      });

    user.password = await bcrypt.hash(
      req.body.password,
      parseInt(process.env.SALT_VALUE)
    );
    await user.save();

    await new Token({ token: req.token }).save();
    const token = new User().generateAuthToken(req.user);
    user.password = "";

    return res.send({ user: user, token: token });
  } catch (err) {
    console.log(err);
    return res.status(403).send({
      password: {
        value: "",
        msg: "Unable to change your password. Please try again",
        param: "password",
      },
    });
  }
};

exports.log_out = async (req, res) => {
  await new Token({ token: req.token }).save();
  return res.send({ message: "logged out!" });
};

exports.post_user = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.mapped());
  }

  let user = await User.findOne({ email: req.body.email });
  if (user)
    return res.status(422).send({
      email: {
        value: req.body.email,
        msg: "with this email a user already exists.",
        param: "email",
      },
    });

  user = new User({
    _id: mongoose.Types.ObjectId(),
    name: req.body.name,
    password: req.body.password,
    email: req.body.email,
    phone_number: req.body.phone_number,
    address: req.body.address,
    sex: req.body.sex,
  });

  // FOR [TESTING] ONLY
  if (req.query.admin) user.role = "Admin";
  // END

  if (user.password)
    user.password = await bcrypt.hash(
      user.password,
      parseInt(process.env.SALT_VALUE)
    );

  try {
    const token = user.generateAuthToken(user);

    //         user.current_token = token
    await user.save();
    user.password = "";

    return res.send({ user: user, token: token });
  } catch (err) {
    return res.status(422).send(err);
  }
};

exports.update_user = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.mapped());
  }

  let user = await User.findById(req.user._id);

  user.name = req.body.name || user.name;
  user.phone_number = req.body.phone_number || user.phone_number;
  user.address = req.body.address || user.address;
  user.sex = req.body.sex || user.sex;

  try {
    await user.save();
    user.password = "";

    return res.send(user);
  } catch (err) {
    return res.status(422).send(err);
  }
};

// profile pic
exports.upload_profile = async (req, res) => {
  if (req.files && req.files.gcsUrl) {
    try {
      let user = await User.findById(req.user._id);

      if (user.avatar) {
        await cloudinary.uploader.destroy(
          decodeURI(user.avatar.split("/").pop()),
          { resource_type: "raw" }
        );
      }

      user.avatar = req.files.gcsUrl;
      user = await user.save();
      user.password = "";

      return res.send(user);
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  return res.status(500).send({ message: "Unable to upload" });
};

exports.delete_user = async (req, res) => {
  try {
    let user = await User.findById(req.user._id);
    await User.findByIdAndDelete(req.user._id);
    if (user.avatar) {
      await cloudinary.uploader.destroy(
        decodeURI(user.avatar.split("/").pop()),
        { resource_type: "raw" }
      );
    }

    return res.send({ message: "account profile deleted successfully" });
  } catch (err) {
    return res.status(500).send(err);
  }
};
