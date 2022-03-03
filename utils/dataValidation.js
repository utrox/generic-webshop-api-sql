const customError = require("../utils/customError");
const promisifyDbQuery = require("../utils/promisifyDbQuery");

const requiredData = (requiredData) => {
  var missing = [];
  for (var pair of Object.entries(requiredData)) {
    if (!pair[1]) missing.push(pair[0]);
  }
  if (missing.length > 0) {
    throw new customError(
      `The following fields are missing: ${missing.join(", ")}.`,
      400
    );
  }
};

const validateLength = ({ min, max }, str, fieldname) => {
  const strlen = str.length;
  if (strlen > max || strlen < min)
    throw new customError(
      `The length of ${fieldname} must be between ${min} and ${max} characters long.`,
      400
    );
};

const validateEmail = (email) => {
  const isValid = String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );

  if (!isValid) throw new customError("Email adress invalid.", 400);
};

const validatePassword = (password) => {
  if (password.length < 6 || password.length > 16) {
    throw new customError(
      "Your password must be between 6 and 16 characters long."
    );
  }
  // can implement additional checks too.
};

const getCategoryId = async (db, categoryName) => {
  const sqlQuery = `
  SELECT category_id
  FROM categories 
  WHERE category_name = ? 
  `;

  const response = await promisifyDbQuery(
    db,
    sqlQuery,
    categoryName.toLowerCase()
  );
  if (response.length !== 1) return null;
  return response[0].category_id;
};

const validatePrice = (input) => {
  const price = new Number(input);
  if (isNaN(price) || price < 1) {
    throw new customError(
      "The price of the product must be a valid number, bigger than 0.",
      422
    );
  }
};

const validateRating = (input) => {
  const price = new Number(input);
  if (isNaN(price) || price < 1 || price > 5) {
    throw new customError(
      "The rating of the review must be a valid number between 1 and 5.",
      422
    );
  }
};

module.exports = {
  requiredData,
  validateLength,
  validateEmail,
  validatePassword,
  getCategoryId,
  validatePrice,
  validateRating,
};
