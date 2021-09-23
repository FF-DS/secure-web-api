const { User } = require("../../models/accounts/User");
const cloudinary = require("cloudinary").v2;

// Accounts API
function getFilters(req) {
  let filters = {};

  if (req.query.name) {
    req.query.name = req.query.name.replace(/,\s*$/, "");
    Object.assign(filters, {
      $or: [
        {
          name: { $regex: req.query.name.split(",").join("|"), $options: "i" },
        },
        {
          email: { $regex: req.query.name.split(",").join("|"), $options: "i" },
        },
        {
          phone_number: {
            $regex: req.query.name.split(",").join("|"),
            $options: "i",
          },
        },
        {
          address: {
            $regex: req.query.name.split(",").join("|"),
            $options: "i",
          },
        },
      ],
    });
  }

  if (req.query.user_type)
    filters["role"] = { $in: req.query.user_type.split(",") };

  if (req.query.verified) filters["verified"] = true;

  if (req.query.sex) filters["sex"] = { $in: req.query.sex.split(",") };

  if (req.query.country)
    filters["country"] = { $in: req.query.country.split() };

  filters["created_at"] = {
    $gte: req.query.created_date_start
      ? req.query.created_date_start
      : "1901-10-26",
    $lte: req.query.created_date_end
      ? req.query.created_date_end
      : "2987-10-19",
  };

  return filters;
}

//------------------------------------------//

exports.get_users = async (req, res) => {
  let filters = getFilters(req);

  let userbject = User;
  let count = await userbject.countDocuments(filters);

  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || count;

  const data = await userbject
    .find(filters, {}, { skip: (page - 1) * size, limit: size * 1 })
    .sort({ updated_at: "desc" });

  const result = {
    data_count: count,
    page_size: size,
    current_page: page,
    data: data,
    map_location: req.visitor_location,
  };

  return res.send(result);
};

exports.delete_user = async (req, res) => {
  try {
    let user = await User.findById(req.params.id);
    await User.findByIdAndDelete(req.params.id);

    if (user.avatar) {
      await cloudinary.uploader.destroy(
        decodeURI(user.avatar.split("/").pop()),
        { resource_type: "raw" }
      );
    }

    return res.send({ message: "deleted" });
  } catch (err) {
    return res.status(404).send(err);
  }
};

exports.change_account_state = async (req, res) => {
  if (
    !req.body.account_state ||
    !["Unblocked", "Blocked"].includes(req.body.account_state)
  ) {
    return res.status(422).send({
      account_state: {
        value: req.body.account_state,
        msg: "A valid account state type is required",
        param: "account_state",
      },
    });
  }

  try {
    let user = await User.findById(req.params.id);
    if (user.role == "Admin") {
      return res.status(422).send({
        account_state: {
          msg: "Can't change the state of admin account",
          param: "account_state",
        },
      });
    }
    user.account_state = req.body.account_state;
    user = await user.save();

    return res.send(user);
  } catch (err) {
    return res.status(422).send(err);
  }
};

// send account create invitation
//  *** mark it as verified
