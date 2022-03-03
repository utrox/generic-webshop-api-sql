const User = require("../db/models/User");
const bcrypt = require("bcrypt");
const path = require("path");
const jwt = require("jsonwebtoken");
const attachAuthCookie = require("../utils/attachAuthCookie");
const { sendVerifyEmail, sendRecoveryEmail } = require("../utils/send-mail");
const customError = require("../utils/customError");

const { requiredData, validateLength } = require("../utils/dataValidation");

const register = async (req, res) => {
  const { username, email, password } = req.body;
  requiredData({ username, email, password }, res);

  const newUser = new User({ username, email, password });

  User.create(newUser, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });
    return res.status(201).send({ ...result });
  });
};

const activateAccount = async (req, res) => {
  const { activationToken } = req.body;

  User.activate(activationToken, (err, result) => {
    console.log(err);
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });
    else {
      res.json({ ...result });
    }
  });
};

const login = async (req, res) => {
  const { username, password } = req.body;

  requiredData({ username, password }, res);

  User.verifyLogin({ username, password }, (err, result) => {
    if (err)
      return res.status(err.status || 401).json({
        msg: err.message || "Some error has occured. Please try again.",
      });
    else {
      attachAuthCookie(res, result.token);
      return res.status(200).json({ ...result, msg: "Login successful." });
    }
  });
};

const logout = (req, res) => {
  // remove cookie
  res.cookie("token", "", {
    maxAge: 5,
    signed: true,
    /* secure: true, */ httpOnly: true,
  });
  return res.status(200).json({ msg: "Logged out successfully." });
};

const requestRecovery = async (req, res) => {
  const { email } = req.body;

  User.sendRecoveryToken({ email });
  // the response is the same even if the email doesn't exist, as to not leak information.
  return res
    .status(200)
    .json({ msg: "Recovery email sent. It expires in 10 minutes." });
};

const recoverAccount = async (req, res) => {
  const { newPassword, confirmNewPassword, recoveryJWT } = req.body;

  if (!newPassword || newPassword !== confirmNewPassword) {
    throw new customError(
      "Please ensure you're providing two matching passwords.",
      400
    );
  }

  // decodes and verifies the JWT
  const verifiedJWT = await jwt.verify(recoveryJWT, process.env.JWT_SECRET);

  const { userID, recoveryToken } = verifiedJWT.payload;
  User.verifyRecoveryToken(
    { user_id: userID, recoveryToken },
    (err, result) => {
      if (err)
        return res.status(err.status || 401).json({
          msg: err.message || "Some error has occured. Please try again.",
        });

      User.setNewPassword({ newPassword, user_id: userID }, (err, result) => {
        if (err)
          return res.status(err.status || 401).json({
            msg: err.message || "Some error has occured. Please try again.",
          });

        return res.status(200).json({ ...result });
      });
    }
  );
};

module.exports = {
  login,
  register,
  recoverAccount,
  requestRecovery,
  activateAccount,
  logout,
};
