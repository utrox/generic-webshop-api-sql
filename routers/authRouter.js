const express = require("express");
const router = express.Router();
const {
  register,
  activateAccount,
  login,
  logout,
  recoverAccount,
  requestRecovery,
} = require("../controllers/authController");

router.post("/register", register);
router.post("/activate-account", activateAccount);
router.post("/login", login);
router.post("/logout", logout);
router.post("/request-recovery", requestRecovery);
router.route("/recovery").post(recoverAccount);

module.exports = router;
