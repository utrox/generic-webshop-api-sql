const bcrypt = require("bcrypt");

const returnHash = async (string) => {
  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(string, salt);
  return hashed;
};

module.exports = returnHash;
