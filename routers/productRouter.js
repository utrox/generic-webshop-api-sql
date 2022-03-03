const express = require("express");
const multer = require("multer");
const upload = multer();
const router = express.Router();

const {
  getAllProducts,
  createProduct,
  getSingleProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const {
  authMiddleware,
  checkAdminPermission,
} = require("../middlewares/auth-middlewares");

router
  .route("/")
  .get(getAllProducts)
  .post(
    [authMiddleware, checkAdminPermission, upload.array("images", 5)],
    createProduct
  );

router
  .route("/:id")
  .get(getSingleProduct)
  .patch(
    [authMiddleware, checkAdminPermission, upload.array("imagesToAdd", 5)],
    updateProduct
  )
  .delete([authMiddleware, checkAdminPermission], deleteProduct);

module.exports = router;
