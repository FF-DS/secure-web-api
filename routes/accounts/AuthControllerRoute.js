var express = require("express");
var router = express.Router();
const { auth } = require("../../middlewares/auth.js");
const {
  LoginValidator,
  UserValidator,
  UserUpdateValidator,
} = require("../../models/accounts/User");

const { multerUploads } = require("../../config/multerConfig");
const { sendUploadToGCS } = require("../../middlewares/CloudinaryCloudStorage");

// Require controller modules.
var authController = require("../../controllers/accounts/AuthController");

router.get("/api/auth/user", auth, authController.get_current_user);
router.get("/api/auth/logout", auth, authController.log_out);

router.post("/api/auth/register", UserValidator, authController.post_user);
router.post("/api/auth/login", LoginValidator, authController.log_in);

router.put("/api/user", auth, UserUpdateValidator, authController.update_user);
router.delete("/api/user", auth, authController.delete_user);

//profile
router.post(
  "/api/user/profile",
  auth,
  multerUploads,
  sendUploadToGCS,
  authController.upload_profile
);

module.exports = router;
