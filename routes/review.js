const express = require("express");
const router = express.Router();

const {
  insertReview,
  modifyReview,
  deleteReview,
  getReviews
} = require("../src/review/review");

// Get reviews for a band
router.get("/reviews/:band_id", async (req, res) => {
  try {
    const band_id = req.params.band_id;
    const reviews = await getReviews(band_id);

    return res.status(200).json({
      success: true,
      band_id: band_id,
      count: reviews.length,
      reviews: reviews,
    });
  } catch (err) {
    console.error("Error getting reviews:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// Create a new review
router.post("/reviews", async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    if (!data.band_id || !data.user_id || !data.rating || !data.comment) {
      return res.status(400).json({
        success: false,
        error: "Missing required review fields",
      });
    }

    // Validate rating range
    if (data.rating < 1 || data.rating > 5) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    const result = await insertReview(
      data.band_id,
      data.user_id,
      data.rating,
      data.comment
    );

    return res.status(201).json({
      success: true,
      message: "Review created successfully",
      review: result,
    });
  } catch (err) {
    console.error("Error creating review:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// Update an existing review
router.put("/reviews/:review_id", async (req, res) => {
  try {
    const review_id = req.params.review_id;
    const data = req.body;

    // Validate rating if provided
    if (data.rating && (data.rating < 1 || data.rating > 5)) {
      return res.status(400).json({
        success: false,
        error: "Rating must be between 1 and 5",
      });
    }

    const result = await modifyReview(
      review_id,
      data.rating,
      data.comment
    );

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review: result,
    });
  } catch (err) {
    console.error("Error updating review:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

// Delete a review
router.delete("/reviews/:review_id", async (req, res) => {
  try {
    const review_id = req.params.review_id;
    
    const result = await deleteReview(review_id);

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting review:", err);
    return res.status(500).json({
      success: false,
      error: "Server error: " + err.message,
    });
  }
});

module.exports = router;