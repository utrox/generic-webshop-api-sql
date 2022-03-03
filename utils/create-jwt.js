const jwt = require("jsonwebtoken");

const createJWT = (payload, options = {}) => {
  console.log(payload);
  return jwt.sign({ payload }, process.env.JWT_SECRET, options);
};

module.exports = createJWT;
