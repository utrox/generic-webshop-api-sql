const crypto = require("crypto");

module.exports = (noBytes) => crypto.randomBytes(noBytes).toString("hex");
