const jwt = require("jsonwebtoken");
const { Token } = require("../models/accounts/Token");

const roles = require("../role");
const { Compliant } = require("../models/services/Compliant");

exports.auth = async function (req, res, next) {
  let token = req.headers["x-access-token"] || req.headers["authorization"];

  if (!token) return res.status(401).send("Access denied. No token provided.");

  try {
    token = token.split(" ")[1];

    let exists = await Token.findOne({ token: token });
    if (exists) return res.status(403).send("Expired or invalidated token.");

    const decoded = jwt.verify(token, process.env.APP_SECRET_KEY);
    req.user = decoded.user;
    req.token = token;

    next();
  } catch (ex) {
    return res.status(403).send("Invalid token.");
  }
};

// ------------- authorization ------------------

let check_user_action = async (req, action, resource) => {
  if (!["updateOwn", "deleteOwn", "readOwn"].includes(action)) {
    return true;
  }

  const userResource = new Set();

  if (resource == "compliant") {
    let userCompliant = await Compliant.find({ creator_user: req.user._id });
    userCompliant.forEach((compliant) => userResource.add(`${compliant._id}`));
  }

  if (!userResource.has(req.params.id)) {
    return false;
  }
  return true;
};

exports.authorize = function (action, resource) {
  return async (req, res, next) => {
    try {
      const permission = roles.can(req.user.role)[action](resource);

      if (!permission.granted) {
        return res
          .status(401)
          .send("You don't have enough permission to perform this action");
      }

      let result = await check_user_action(req, action, resource);
      if (!result) {
        return res.status(401).send({
          param: resource,
          msg: `You are not authorized to edit this ${resource}.`,
        });
      }

      next();
    } catch (error) {
      return res
        .status(401)
        .send("You don't have enough permission to perform this action");
    }
  };
};
