var db = require("../dbconnection");
const promisifyDbQuery = require("../../utils/promisifyDbQuery");

// constructor for User object
const Image = function (image) {
  this.title = image.image_name;
  this.product_id = image.product_id;
};

Image.recordImagesToDb = async ({ arrayOfImages, productID }, result) => {
  const sqlQuery = `
  INSERT INTO 
    images(product_id, image_name)
  VALUES
    ${arrayOfImages.map((image) => `(${productID}, "${image.newName}")`)}
  `;
  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (!response.affectedRows || response.affectedRows < arrayOfImages.length) {
    return result({
      status: 500,
      message: "There was an error adding the images to the database..",
    });
  } else {
    return result(null);
  }
};

Image.remove = async ({ image, product_id }, result) => {
  const sqlQuery = `
  DELETE FROM images 
  WHERE product_id = ${db.escape(product_id)}
  AND image_name = ${db.escape(image)};
  `;
  const response = await promisifyDbQuery(db, sqlQuery, []);
  if (response.affectedRows === 0) {
    return result(null, { removeSuccessful: false });
  }

  return result(null, { removeSuccessful: true });
};

Image.removeImagesByProductId = async (product_id, result) => {
  const sqlQuery = `SELECT image_name FROM images
   WHERE product_id = ${db.escape(product_id)};`;
  const response = await promisifyDbQuery(db, sqlQuery, []);
  const removedFromDb = Array.from(response.map((row) => row.image_name));
  result(removedFromDb);
};

module.exports = Image;
