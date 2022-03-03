const { handleImages } = require("../utils/image-handling.js");

const createProduct = (req, res) => {
  const newProduct = new Product({ ...req.body });

  Product.create(newProduct, async (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });
    const { product_id } = result;
    const imagePayload = {
      imagesToAdd: req.files,
      productID: product_id,
      imagesToRemove: [],
    };
    const { imageHandling } = await handleImages(imagePayload);
    return res.status(201).json({
      msg: `Product created successfully with ID ${product_id}.`,
      imageHandling,
    });
  });
};

const getAllProducts = async (req, res) => {
  const queryParams = {
    search: req.query.search,
    price: req.query.price,
    manufacturer: req.query.manufacturer,
    category: req.query.category,
    order_by: req.query.order_by,
  };

  Product.getAll(queryParams, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    return res.status(200).json({ ...result });
  });
};

const getSingleProduct = async (req, res) => {
  const product_id = req.params.id;
  // when requesting only one pro

  const response = { product: {}, reviews: [] };

  const getProduct = Product.getById({ product_id }, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    if (result.length === 0)
      return res.status(404).json({
        msg: `Product not found with ID ${product_id}.`,
      });
    response.product = result;
  });
  const getReviewsAboutProduct = Review.getByProductId(
    { product_id },
    (err, result) => {
      if (err)
        return res.status(err.status || 500).json({
          msg: err.message || "Some error has occured. Please try again.",
        });

      response.reviews = Object.values(result);
    }
  );

  await Promise.all([getProduct, getReviewsAboutProduct]);
  return res.status(200).json(response);
};

const updateProduct = (req, res) => {
  const updateData = {
    product_id: req.params.id,
    category: req.body.category,
    updateProperties: {
      title: req.body.title,
      description: req.body.description,
      price: req.body.price,
      manufacturer: req.body.manufacturer,
    },
  };

  const imagesToRemove = req.body.imagesToRemove;

  Product.update(updateData, async (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    const imagePayload = {
      imagesToAdd: req.files,
      productID: updateData.product_id,
      imagesToRemove,
    };
    const { imageHandling } = await handleImages(imagePayload);

    return res.status(200).json({
      ...result,
      imageHandling,
    });
  });
};

const deleteProduct = (req, res) => {
  const product_id = req.params.id;

  Product.remove(product_id, async (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ msg: `Product doesn't exist with ID '${product_id}'.` });
    }

    return res.status(200).json({
      msg: `Product with ID '${product_id}' along with reviews and images about the product were successfully deleted.`,
    });
  });
};

module.exports = {
  getAllProducts,
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};

const Product = require("../db/models/Product");
const Review = require("../db/models/Review");
