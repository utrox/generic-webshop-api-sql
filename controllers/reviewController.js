const Review = require("../db/models/Review");

const createReview = async (req, res) => {
  const reviewData = {
    review_title: req.body.title,
    text: req.body.text,
    rating: req.body.rating,
    user_id: req.user.userID,
    product_id: req.body.product,
  };

  Review.create(reviewData, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    return res.status(201).json({ ...result });
  });
};

const getSingleReview = async (req, res) => {
  const review_id = req.params.id;
  Review.getById({ review_id }, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    return res.status(200).json({ ...result });
  });
};

const updateReview = async (req, res) => {
  const updateData = {
    review_id: req.params.id,
    updateProperties: {
      review_title: req.body.title,
      rating: req.body.rating,
      text: req.body.text,
    },
    user_id: req.user.userID,
    role: req.user.role,
  };

  Review.update(updateData, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    return res.status(200).json({ ...result });
  });
};

const deleteReview = async (req, res) => {
  const review_id = req.params.id;
  const user_id = req.user.userID;
  const role = req.user.role;

  Review.delete({ review_id, user_id, role }, (err, result) => {
    if (err)
      return res.status(err.status || 500).json({
        msg: err.message || "Some error has occured. Please try again.",
      });

    return res.status(201).json({ ...result });
  });
};

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getSingleReview,
};
