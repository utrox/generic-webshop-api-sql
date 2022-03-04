const jwt = require("jsonwebtoken");

// simply returns a JWT token with the given payload and options.
const createJWT = (payload, options = {}) => {
  return jwt.sign({ payload }, process.env.JWT_SECRET, options);
};

module.exports = createJWT;
