var db = require("../dbconnection");
const bcrypt = require("bcrypt");

const {
  validateLength,
  validateEmail,
  validatePassword,
} = require("../../utils/dataValidation");
const generateToken = require("../../utils/generateToken");
const returnHash = require("../../utils/return-hash");
const createJWT = require("../../utils/create-jwt");
const { sendVerifyEmail, sendRecoveryEmail } = require("../../utils/send-mail");

// constructor for User object
const User = function (user) {
  this.username = user.username;
  this.email = user.email;
  this.password = user.password;
};

User.create = async (newUser, result) => {
  var { username, email, password } = newUser;

  try {
    validateLength({ min: 3, max: 20 }, username, "username");
    validateEmail(email);
    validatePassword(password);
  } catch (error) {
    return result({
      status: error.statusCode,
      message: error.message,
    });
  }

  password = await returnHash(password);
  const activationToken = generateToken(48);

  db.query(
    "INSERT INTO users SET ?",
    { username, email, password, activationToken },
    (err, res) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY") {
          return result(
            {
              status: 409,
              message: `${err.sqlMessage.split("'")[1]} is already in use.`,
            },
            null
          );
        }
        return result(err, null);
      }

      sendVerifyEmail(email, username, activationToken);
      result(null, { msg: "User successfully created." });
    }
  );
};

User.activate = (activationToken, result) => {
  // had to do it in a more roundabout way, because of MySQL restrictions.
  //  https://stackoverflow.com/a/14302701/16355114
  const sqlQuery = `
    UPDATE users
    SET isActivated = true, activationToken = NULL
    WHERE user_id = (SELECT user_id 
      FROM (SELECT * 
        FROM users 
        WHERE activationToken= ?) AS temp );
  `;

  db.query(sqlQuery, [activationToken], (err, res) => {
    if (err) return result(err, null);

    if (res.affectedRows === 0) {
      result({ status: 404, message: "Invalid activation token." }, null);
    }

    result(null, {
      msg: "Your account's been activated. Now you can proceed to log in.",
    });
  });
};

User.verifyLogin = ({ username, password }, result) => {
  const sqlQuery = `
    SELECT user_id, username, password, isActivated, role_name AS role
    FROM users 
    JOIN roles 
    ON users.role_id = roles.role_id 
    WHERE username = ? 
    LIMIT 1;
  `;

  db.query(sqlQuery, [username], async (err, res) => {
    if (err) return result(err, null);

    if (res.length === 0)
      return result({ status: 401, message: "Wrong credentials." }, null);

    const storedPassword = res[0]["password"];
    const isActivated = res[0]["isActivated"];

    const isValid = await bcrypt.compare(password, storedPassword);
    if (!isValid)
      return result({ status: 401, message: "Wrong credentials." }, null);

    if (!isActivated)
      return result({
        status: 401,
        message: "You need to verify your email before logging in.",
      });

    const payload = {
      userID: res[0]["user_id"],
      role: res[0]["role"],
      username: res[0]["username"],
    };
    const loginJWT = createJWT(payload, { expiresIn: "24h" });
    result(null, { token: loginJWT });
  });
};

// generate, hash and store recoveryToken it in the database
User.sendRecoveryToken = async ({ email }) => {
  const recoveryToken = generateToken(16);
  const hashedRecoveryToken = await returnHash(recoveryToken);

  // call stored procedure, updating and selecting the user.
  const sqlQuery = `
    CALL UPDATE_RECOVERY_TOKEN_AND_SELECT(?, ?)
 `;

  db.query(sqlQuery, [email, hashedRecoveryToken], async (err, res) => {
    if (err) return result({ err }, null);

    const returnedData = res[0];
    if (returnedData.length === 1) {
      const { user_id, email, username } = returnedData[0];

      // generate JWT token containing userID and recoveryToken
      const payload = { userID: user_id, recoveryToken };
      const jwtToken = createJWT(payload, { expiresIn: "10m" });

      // send this token to the user's email adress.
      sendRecoveryEmail(email, username, jwtToken);
    }
  });
};

User.verifyRecoveryToken = async ({ user_id, recoveryToken }, result) => {
  const sqlQuery = `
    SELECT recoveryToken FROM users WHERE user_id = ?
 `;
  db.query(sqlQuery, [user_id], async (err, res) => {
    if (err) return result({ err }, null);

    const storedRecoveryToken = res[0]["recoveryToken"];
    const isValid = await bcrypt.compare(
      recoveryToken,
      storedRecoveryToken || ""
    );
    if (!isValid)
      return result({ status: 401, message: "Invalid token." }, null);

    result(null, res);
  });
};

User.setNewPassword = async ({ newPassword, user_id }, result) => {
  const sqlQuery = `
    UPDATE users
    SET password = ?, recoveryToken = NULL
    WHERE user_id = ?
 `;

  const hashedNewPassword = await returnHash(newPassword);

  db.query(sqlQuery, [hashedNewPassword, user_id], async (err, res) => {
    if (err) return result({ err }, null);

    result(null, {
      message: "Password changed successfully.",
    });
  });
};

module.exports = User;
