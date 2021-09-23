var express = require("express");
var router = express.Router();
const { auth, authorize } = require("../../middlewares/auth.js");

var accountsController = require("../../controllers/accounts/AccountsController");

router.get(
  "/api/accounts",
  auth,
  authorize("readAny", "accounts"),
  accountsController.get_users
);
router.post(
  "/api/accounts-state/:id",
  auth,
  authorize("updateAny", "accounts"),
  accountsController.change_account_state
);
router.delete(
  "/api/accounts/:id",
  auth,
  authorize("updateAny", "accounts"),
  accountsController.delete_user
);

module.exports = router;
