// if the user is the creator, or an admin they should have authorization.
const CustomError = require("./customError");

const checkAuthorization = (userID, reqUserObj) => {
  if (userID !== reqUserObj.userID && reqUserObj.role !== "admin") {
    throw new CustomError("You are unauthorized to access this route.", 403);
  }
};

module.exports = { checkAuthorization };
