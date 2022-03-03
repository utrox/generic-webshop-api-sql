var db = require("../dbconnection");
const {
  validateLength,
  requiredData,
  validatePrice,
} = require("../../utils/dataValidation");
const promisifyDbQuery = require("../../utils/promisifyDbQuery");
const { removeImagesByProductID } = require("../../utils/image-handling");

// constructor for User object
const Product = function (product) {
  this.title = product.title;
  this.description = product.description;
  this.price = product.price;
  this.manufacturer = product.manufacturer;
  this.category = product.category;
};

Product.create = async (newProduct, result) => {
  const { title, description, price, manufacturer, category } = newProduct;

  try {
    // validation of data
    requiredData({ title, description, price, category });
    validateLength({ min: 10, max: 100 }, title, "title");
    validateLength({ min: 10, max: 500 }, description, "description");
    validatePrice(price);

    const queryParams = {
      title,
      description,
      price,
      manufacturer,
    };

    const sqlQuery = `
  INSERT INTO products ( title, description, price, manufacturer, category_id)
  VALUES 
    (${db.escape(title)}, 
    ${db.escape(description)}, 
    ${db.escape(price)}, 
    ${db.escape(manufacturer)}, 
    (SELECT category_id
      FROM categories 
      WHERE category_name LIKE ${db.escape(category)}));
  `;
    const response = await promisifyDbQuery(db, sqlQuery, queryParams);
    if (response.affectedRows === 1)
      return result(null, {
        message: "Product created successfully.",
        product_id: response.insertId,
      });
    else
      throw new Error(
        "There was an error creating your product. Please try again."
      );
  } catch (error) {
    return result(
      {
        status: error.statusCode,
        message: error.message,
      },
      null
    );
  }
};

Product.getAll = async (queryParams, result) => {
  var { search, category, manufacturer, order_by, price } = queryParams;
  // This query selects the required fields for the response, along with the products' images and their categories' names.
  const defaultQuery = `SELECT * FROM (
  SELECT 	p.product_id,
    title, 
    description, 
    price, 
    manufacturer, 
    (SELECT 
      category_name 
      FROM categories c 
      WHERE p.category_id = c.category_id) 
      AS category, 
    GROUP_CONCAT(DISTINCT i.image_name) AS images,
    COUNT(DISTINCT review_id) AS noReviews,
	  ROUND(SUM(rating) / COUNT(rating), 2) AS avgRating    
  FROM products p 
  LEFT JOIN reviews r 
  ON p.product_id = r.product_id
  LEFT JOIN images i 
  ON p.product_id = i.product_id`;
  // sort default by most recent Product
  const sqlFilters = [];

  if (search) {
    sqlFilters.push(`title LIKE '%${search}%'`);
  }

  if (manufacturer) {
    sqlFilters.push(`manufacturer LIKE "${manufacturer}"`);
  }

  if (price) {
    const [min, max] = price.split("-");
    // ...check if it's a valid query. if not, ignore.
    if (min) {
      sqlFilters.push(`price >= ${min}`);
    }
    if (max) {
      sqlFilters.push(`price <= ${max}`);
    }
  }

  if (order_by) {
    if (order_by[0] === "-") {
      order_by = `${order_by.slice(1)} DESC`;
    }
  } else {
    order_by = "product_id DESC";
  }

  const sqlQuery = `${defaultQuery} 
    ${sqlFilters.length > 0 ? "WHERE" : ""}
    ${sqlFilters.join(" AND ")}
    GROUP BY p.product_id 
    ORDER BY ${order_by})
    AS tempTable 
    WHERE category 
    LIKE '%${category || ""}%'`;

  const response = await promisifyDbQuery(db, sqlQuery, []);
  // GROUP_CONCAT returns a string of image names; split them into array.
  response.forEach((product) => {
    if (product.images) {
      product.images = product.images.split(",") || [];
    }
  });
  return result(null, { noProducts: response.length, products: response });
};

Product.getById = async ({ product_id }, result) => {
  const sqlQuery = `
  SELECT * FROM (
  SELECT
	  p.product_id,
    title,
    description,
    price,
    manufacturer,
    (SELECT
      category_name
      FROM categories c
      WHERE p.category_id = c.category_id)
    AS category,
    GROUP_CONCAT(DISTINCT image_name) AS images,
    COUNT(DISTINCT review_id) AS noReviews,
	  ROUND(SUM(rating) / COUNT(rating), 2) AS avgRating   
  FROM products p
  LEFT JOIN reviews r 
  ON p.product_id = r.product_id
  LEFT JOIN images i
  ON p.product_id = i.product_id
    WHERE p.product_id = 51
    GROUP BY p.product_id)
    AS tempTable;
  `;
  const product = await promisifyDbQuery(db, sqlQuery, []);
  if (!product[0]) {
    return result({
      status: 404,
      message: `Product doesn't exist with ID ${product_id}`,
    });
  }
  console.log(product[0]);
  if (product[0]["images"]) {
    product[0]["images"] = product[0]["images"].split(",") || [];
  }
  return result(null, product);
};

Product.update = async (updateData, result) => {
  const { product_id, category, updateProperties } = updateData;

  const updateSql = [];

  try {
    const { title, description, price } = updateProperties;
    title && validateLength({ min: 10, max: 100 }, title, "title");
    description &&
      validateLength({ min: 10, max: 500 }, description, "description");
    price && validatePrice(price);

    for (const [key, value] of Object.entries(updateProperties)) {
      if (value) {
        updateSql.push(`${key} = ${db.escape(value)}`);
      }
    }

    if (category) {
      updateSql.push(
        `category_id = (SELECT category_id 
        FROM categories
        WHERE category_name
        LIKE ${db.escape(category)})`
      );
    }

    const sqlQuery = `
  UPDATE products
  SET ${updateSql.join(", ")}
  WHERE product_id = ${db.escape(product_id)};
  `;
    const response = await promisifyDbQuery(db, sqlQuery, []);
    if (response.affectedRows === 0)
      return result({
        status: 404,
        message: `Edit unsuccessful of product with ID ${product_id}. Check if the product exists, and try again.`,
      });

    return result(null, {
      message: `Product successfully updated with ID ${product_id}.`,
    });
  } catch (error) {
    return result(
      {
        status: error.statusCode,
        message: error.message,
      },
      null
    );
  }
};

Product.remove = async (product_id, result) => {
  const sqlQuery = `DELETE FROM products WHERE product_id = ${product_id}`;
  await removeImagesByProductID(product_id);
  await Review.deleteByProductId(product_id, (err) => {
    if (err)
      return result({
        status: 500,
        message:
          "There was an error removing the reviews about the product from the database.",
      });
  });
  const response = await promisifyDbQuery(db, sqlQuery, []);
  return result(null, response);
};

Product.exists = async (product_id, error) => {
  const sqlQuery = `
  SELECT product_id FROM products WHERE product_id = ${db.escape(product_id)}`;
  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (response.length === 0)
    return error({
      status: 404,
      message: `Product doesn't exist with ID '${product_id}'.`,
    });
  else return error(null);
};

module.exports = Product;
const Review = require("./Review");
