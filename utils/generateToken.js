const crypto = require("crypto");

// returns a token of a given length
module.exports = (noBytes) => crypto.randomBytes(noBytes).toString("hex");
