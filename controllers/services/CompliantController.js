const mongoose = require("mongoose");
const { Compliant } = require("../../models/services/Compliant");
const { validationResult } = require("express-validator");
const { User } = require("../../models/accounts/User");
const _ = require("lodash");
const cloudinary = require("cloudinary").v2;

// Compliant API
function getFilters(req) {
  let filters = {};

  if (req.query.searchQuery) {
    req.query.searchQuery = req.query.searchQuery.replace(/,\s*$/, "");
    Object.assign(filters, {
      $or: [
        {
          title: {
            $regex: req.query.searchQuery.split(",").join("|"),
            $options: "i",
          },
        },
        {
          details: {
            $regex: req.query.searchQuery.split(",").join("|"),
            $options: "i",
          },
        },
      ],
    });
  }

  if (req.user.role != "Admin") {
    filters["creator_user"] = req.user._id;
  }

  return filters;
}

//------------------------------------------//

exports.get_compliants = async (req, res) => {
  let filters = getFilters(req);

  // --------- check ------------- //
  let user = await User.findById(req.user._id);
  if (user.account_state == "Blocked")
    return res.status(401).send({
      data_count: 0,
      page_size: 0,
      current_page: 0,
      data: [],
    });
  // --------- check ------------- //

  let count = await Compliant.countDocuments(filters);

  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || count;

  const data = await Compliant.find(
    filters,
    {},
    { skip: (page - 1) * size, limit: size * 1 }
  )
    .populate({ path: "creator_user", select: "-__v -password" })
    .sort({ updated_at: "desc" });

  const result = {
    data_count: count,
    page_size: size,
    current_page: page,
    data: data,
  };

  return res.send(result);
};

exports.get_compliant_by_id = async (req, res) => {
  try {
    // --------- check ------------- //
    let user = await User.findById(req.user._id);
    if (user.account_state == "Blocked")
      return res.status(401).send({
        compliant: {},
      });
    // --------- check ------------- //

    let compliant = await Compliant.findById(req.params.id).populate({
      path: "creator_user",
      select: "-__v -password",
    });

    return res.send({
      compliant: compliant,
    });
  } catch (err) {
    return res.status(404).send(err);
  }
};

exports.get_compliant_by_user_id = async (req, res) => {
  let complaints = await Compliant.find({ creator_user: req.query.user_id })
    .populate("creator_user")
    .sort({ updated_at: "desc" });
  return res.send(complaints);
};

exports.get_all_compliant_title = async (req, res) => {
  let all_compliants = await Compliant.find({});
  let compliants_title = [];
  all_compliants.forEach((compliant) => compliants_title.push(compliant.title));

  return res.send(compliants_title);
};

exports.post_compliant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.mapped());
  }

  // --------- check ------------- //
  let user = await User.findById(req.user._id);
  if (user.account_state == "Blocked")
    return res.status(401).send({
      email: {
        msg: "Sorry it seems there is issue with your account, please login again.",
        param: "title",
      },
    });
  // --------- check ------------- //

  let compliant = new Compliant(_.pick(req.body, ["title", "details"]));

  try {
    compliant._id = mongoose.Types.ObjectId();
    compliant.creator_user = req.user._id;
    compliant = await compliant.save();

    return res.send(compliant);
  } catch (err) {
    // console.log(err)
    return res.status(422).send(err);
  }
};

exports.update_compliant = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).jsonp(errors.mapped());
  }

  // --------- check ------------- //
  let user = await User.findById(req.user._id);
  if (user.account_state == "Blocked")
    return res.status(401).send({
      email: {
        msg: "Sorry it seems there is issue with your account, please login again.",
        param: "title",
      },
    });
  // --------- check ------------- //

  try {
    await Compliant.findByIdAndUpdate(
      req.params.id,
      _.pick(req.body, ["title", "details"])
    );
    return res.send(await Compliant.findById(req.params.id));
  } catch (err) {
    return res.status(422).send(err);
  }
};

exports.delete_compliant = async (req, res) => {
  try {
    // --------- check ------------- //
    let user = await User.findById(req.user._id);
    if (user.account_state == "Blocked")
      return res.status(401).send({
        email: {
          message:
            "Sorry it seems there is issue with your account, please login again.",
        },
      });
    // --------- check ------------- //

    let compliant = await Compliant.findById(req.params.id);
    await Compliant.findByIdAndDelete(req.params.id);

    if (compliant.file_links && compliant.file_links.length)
      await deletFiles(compliant.file_links, []);

    return res.send({ message: "deleted" });
  } catch (err) {
    return res.status(404).send(err);
  }
};

exports.upload_compliant_file = async (req, res) => {
  // --------- check ------------- //
  let user = await User.findById(req.user._id);
  if (user.account_state == "Blocked")
    return res.status(401).send({
      email: {
        message:
          "Sorry it seems there is issue with your account, please login again.",
      },
    });
  // --------- check ------------- //

  if (req.files && req.files.gcsUrl) {
    try {
      let compliant = await Compliant.findById(req.params.id);

      compliant.file_links.push({
        link: req.files.gcsUrl,
        name: req.files.file.name,
        public_file_name: req.files.public_file_name,
      });
      await compliant.save();
      return res.send({ link: req.files.gcsUrl, name: req.files.file.name });
    } catch (err) {
      return res.status(500).send(err);
    }
  }

  return res.status(500).send({ message: "Unable to upload" });
};

exports.update_compliant_file = async (req, res) => {
  // --------- check ------------- //
  let user = await User.findById(req.user._id);
  if (user.account_state == "Blocked")
    return res.status(401).send({
      email: {
        message:
          "Sorry it seems there is issue with your account, please login again.",
      },
    });
  // --------- check ------------- //

  try {
    let compliant = await Compliant.findById(req.params.id);
    await deletFiles(compliant.file_links, req.body.file_links);

    compliant.file_links = req.body.file_links;
    await compliant.save();
    return res.send(compliant.file_links);
  } catch (err) {
    console.log(err);
    return res.status(500).send({ message: "Unable to update" });
  }
};

let deletFiles = async (old_files, new_files) => {
  new_files = new Set(new_files.map((file) => file.link.split("/").pop()));

  let delete_files = old_files.filter(
    (file) => !new_files.has(file.link.split("/").pop())
  );
  delete_files = delete_files.map((file) => file.public_file_name);

  return cloudinary.api.delete_resources(
    delete_files,
    { resource_type: "raw" },
    function (error, result) {
      error;
      result;
    }
  );
};
