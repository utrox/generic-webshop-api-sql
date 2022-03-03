const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
    console.log(token);
  } else {
    token = req.signedCookies.token;
  }

  // if the user is not authenticated, send response.
  if (!token) {
    return res.status(403).send("You must be logged in to do that.");
  }
  const verifiedToken = await jwt.verify(token, process.env.JWT_SECRET);
  req.user = verifiedToken.payload;
  next();
};

const checkAdminPermission = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res
      .status(403)
      .send("You are unauthorized to access this route.", 403);
  }
  next();
};

module.exports = { authMiddleware, checkAdminPermission };
