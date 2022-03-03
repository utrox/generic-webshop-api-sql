var db = require("../dbconnection");
const bcrypt = require("bcrypt");
const {
  validateLength,
  requiredData,
  validateRating,
} = require("../../utils/dataValidation");
const promisifyDbQuery = require("../../utils/promisifyDbQuery");

const CustomError = require("../../utils/customError");

// constructor for User object
const Review = function (review) {
  this.review_title = review.review_title;
  this.text = review.text;
  this.rating = review.rating;
  this.user_id = review.user_id;
  this.product_id = review.product_id;
};

Review.create = async (newReview, result) => {
  const { review_title, text, rating, user_id, product_id } = newReview;
  // chgeck if Product.exists
  try {
    await Product.exists(product_id, (err) => {
      if (err) {
        throw new CustomError(
          err.message || "Some error has occured. Please try again.",
          err.status || 500
        );
      }
    });

    // check if user already reviewed Review.userAlreadyReviewed()

    await Review.userAlreadyReviewed({ product_id, user_id }, (err) => {
      if (err) {
        throw new CustomError(
          err.message || "Some error has occured. Please try again.",
          err.status || 500
        );
      }
    });

    // validate input fields
    requiredData({ review_title, text, rating, user_id, product_id });
    validateLength({ min: 5, max: 100 }, review_title, "review title");
    validateLength({ min: 5, max: 500 }, text, "text");
    validateRating(rating);
  } catch (error) {
    return result({
      status: error.statusCode,
      message: error.message,
    });
  }
  // create the review.

  const sqlQuery = `
  INSERT INTO reviews(review_title, text, rating, user_id, product_id)
VALUES(${db.escape(review_title)}, 
    ${db.escape(text)}, 
    ${db.escape(rating)}, 
    ${db.escape(user_id)}, 
    ${db.escape(product_id)})
  `;

  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (response.affectedRows === 1) {
    result(null, {
      message: `Review about product created successfully with ID ${response.insertId}`,
    });
  } else {
    return result({
      status: error.statusCode || 500,
      message:
        error.message ||
        "There was an error recording review into database. Please try again.",
    });
  }
};

Review.getById = async ({ review_id }, result) => {
  const sqlQuery = `
  SELECT p.product_id, p.title AS product_name, review_title, text, rating, username AS poster
  FROM reviews r
  JOIN users u
  ON r.user_id = u.user_id
  JOIN products p 
  ON r.product_id = p.product_id
  WHERE review_id = ${db.escape(review_id)};
  `;
  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (response.length === 0) {
    return result({
      status: 404,
      message: `Review with ID ${review_id} doesn't exist.`,
    });
  }

  return result(null, response[0]);
};

Review.update = async (
  { review_id, updateProperties, user_id, role },
  result
) => {
  const updateSql = [];
  const isUserAdmin = role === "admin";

  const { review_title, text, rating } = updateProperties;

  try {
    review_title &&
      validateLength({ min: 5, max: 100 }, review_title, "review title");
    text && validateLength({ min: 5, max: 500 }, text, "text");
    rating && validateRating(rating);
  } catch (error) {
    return result(
      {
        status: error.statusCode,
        message: error.message,
      },
      null
    );
  }

  for (const [key, value] of Object.entries(updateProperties)) {
    if (value) {
      updateSql.push(`${key} = ${db.escape(value)}`);
    }
  }

  const sqlQuery = `
  UPDATE reviews
  SET ${updateSql.join(", ")}
  WHERE review_id = ${db.escape(review_id)}
  ${isUserAdmin ? "" : `AND user_id = ${db.escape(user_id)}`}`;

  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (response.affectedRows === 0) {
    if (isUserAdmin) {
      return result({
        status: 404,
        message: `Review doesn't exist with ID ${review_id}.`,
      });
    }
    return result({
      status: 401,
      message: `You are unauthorized to make changes to review with ID ${review_id}.`,
    });
  }

  return result(null, {
    message: `Review successfully modified with ID ${review_id}`,
  });
};

Review.delete = async ({ review_id, user_id, role }, result) => {
  var sqlQuery = `
  DELETE FROM reviews WHERE review_id = ${db.escape(review_id)}
  `;
  if (role !== "admin") {
    sqlQuery += ` AND user_id = ${db.escape(user_id)}`;
  }
  const response = await promisifyDbQuery(db, sqlQuery, []);
  try {
    if (response.affectedRows === 1) {
      return result(null, { message: "Review successfully deleted." });
    }

    return result({
      status: 401,
      message:
        "You are not authorized to delete this review, or it doesn't exist.",
    });
  } catch (error) {
    return result({
      status: 500,
      message:
        "An error occured trying to delete the review. Please try again.",
    });
  }
};

Review.getByProductId = async ({ product_id }, result) => {
  const sqlQuery = `
  SELECT 
    review_title, 
    text, 
    rating, 
    username AS poster
  FROM reviews r
  JOIN users u
  ON r.user_id = u.user_id
  JOIN products p 
  ON r.product_id = p.product_id
  WHERE p.product_id = ${db.escape(product_id)};`;
  const response = await promisifyDbQuery(db, sqlQuery, []);
  result(null, { ...response });
};

Review.deleteByProductId = async (product_id, result) => {
  const sqlQuery = `DELETE FROM reviews 
  WHERE product_id = ${db.escape(product_id)}`;
  await promisifyDbQuery(db, sqlQuery, []);
};

Review.userAlreadyReviewed = async ({ product_id, user_id }, error) => {
  const sqlQuery = `
  SELECT * FROM reviews 
  WHERE product_id = ${db.escape(product_id)} 
  AND user_id = ${db.escape(user_id)};
  `;

  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (response.length !== 0) {
    return error({
      status: 404,
      message: `You've already reviewed product with ID '${product_id}'. Please edit your existing review, or delete it.`,
    });
  }
};

module.exports = Review;
const Product = require("./Product");
