const jwt = require("jsonwebtoken");

const createJWT = (payload, options = {}) => {
  return jwt.sign({ payload }, process.env.JWT_SECRET, options);
};

module.exports = createJWT;
