const attachAuthCookie = (res, token) => {
  // TODO if secure is set to true, the cookie doesn't show up in Postman. Remove for production version
  res.cookie("token", token, {
    maxAge: 24 * 60 * 60 * 1000,
    signed: true,
    /* secure: true, */ httpOnly: true,
  });
};

module.exports = attachAuthCookie;
