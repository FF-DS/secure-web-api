var express = require("express");
var router = express.Router();

const { auth, authorize } = require("../../middlewares/auth.js");
const { CompliantValidator } = require("../../models/services/Compliant");

const { multerUploads } = require("../../config/multerConfig");
const { sendUploadToGCS } = require("../../middlewares/CloudinaryCloudStorage");

var compliantController = require("../../controllers/services/CompliantController");

router.get(
  "/api/compliant-user/:id",
  auth,
  authorize("readOwn", "compliant"),
  compliantController.get_compliant_by_id
);

router.get("/api/compliant-user", auth, compliantController.get_compliants);

router.post(
  "/api/compliant-user",
  auth,
  authorize("createOwn", "compliant"),
  CompliantValidator,
  compliantController.post_compliant
);

router.put(
  "/api/compliant-user/:id",
  auth,
  authorize("updateOwn", "compliant"),
  CompliantValidator,
  compliantController.update_compliant
);

router.delete(
  "/api/compliant-user/:id",
  auth,
  authorize("deleteOwn", "compliant"),
  compliantController.delete_compliant
);

// file
router.post(
  "/api/compliant-user/file/:id",
  auth,
  authorize("updateOwn", "compliant"),
  multerUploads,
  sendUploadToGCS,
  compliantController.upload_compliant_file
);

router.put(
  "/api/compliant-user/file/:id",
  auth,
  authorize("updateOwn", "compliant"),
  compliantController.update_compliant_file
);

module.exports = router;
