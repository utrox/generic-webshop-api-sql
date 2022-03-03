const express = require("express");
const router = express.Router();
const {
  getAllReviews,
  createReview,
  getSingleReview,
  updateReview,
  deleteReview,
} = require("../controllers/reviewController");

const { authMiddleware } = require("../middlewares/auth-middlewares");

router.route("/").post(authMiddleware, createReview);
router
  .route("/:id")
  .get(getSingleReview)
  .patch(authMiddleware, updateReview)
  .delete(authMiddleware, deleteReview);

module.exports = router;
