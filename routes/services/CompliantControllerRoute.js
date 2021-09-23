var express = require("express");
var router = express.Router();

const { auth, authorize } = require("../../middlewares/auth.js");
var compliantController = require("../../controllers/services/CompliantController");

router.get(
  "/api/compliant/title",
  auth,
  authorize("readAny", "compliant"),
  compliantController.get_all_compliant_title
);

router.get(
  "/api/compliant/by-user",
  auth,
  authorize("readAny", "compliant"),
  compliantController.get_compliant_by_user_id
);

router.get(
  "/api/compliant/:id",
  auth,
  authorize("readAny", "compliant"),
  compliantController.get_compliant_by_id
);

router.get("/api/compliant", auth, compliantController.get_compliants);

router.delete(
  "/api/compliant/:id",
  auth,
  authorize("deleteAny", "compliant"),
  compliantController.delete_compliant
);

module.exports = router;
