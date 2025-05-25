import express, { Request, Response } from "express";
import { ReviewModel } from "../models/reviews";
import { userIsLoggedIn } from "../middlewares/admin"; // Assuming you have user login check middleware
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

// POST: Create a new review
router.post("/create", userIsLoggedIn, asyncHandler(async (req: Request, res: Response) => {
  const { productId, rating, comment } = req.body;
  const userId = req.session?.passport?.user; // depends how you store user

  if (!productId || !rating) {
    return res.status(400).send("Product ID and Rating are required");
  }

  await ReviewModel.create({
    user: new mongoose.Types.ObjectId(userId),
    product: new mongoose.Types.ObjectId(productId),
    rating,
    comment
  });

  res.status(201).send("Review created successfully");
}));

// GET: Get all reviews for a specific product
router.get("/product/:productId", asyncHandler(async (req: Request, res: Response) => {
  const { productId } = req.params;

  const reviews = await ReviewModel.find({ product: productId }).populate("user", "name");

  res.status(200).json({ reviews });
}));

// PATCH: Update a review
router.patch("/update/:reviewId", userIsLoggedIn, asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.session?.passport?.user;

  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    return res.status(404).send("Review not found");
  }

  if (review.user.toString() !== userId) {
    return res.status(403).send("You can only update your own review");
  }

  if (rating) review.rating = rating;
  if (comment) review.comment = comment;

  await review.save();

  res.status(200).send("Review updated successfully");
}));

// DELETE: Delete a review
router.delete("/delete/:reviewId", userIsLoggedIn, asyncHandler(async (req: Request, res: Response) => {
  const { reviewId } = req.params;
  const userId = req.session?.passport?.user;

  const review = await ReviewModel.findById(reviewId);

  if (!review) {
    return res.status(404).send("Review not found");
  }

  if (review.user.toString() !== userId) {
    return res.status(403).send("You can only delete your own review");
  }

  await ReviewModel.findByIdAndDelete(reviewId);

  res.status(200).send("Review deleted successfully");
}));

// (Optional) GET: Get all reviews by a specific user
router.get("/user/:userId", asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const reviews = await ReviewModel.find({ user: userId }).populate("product", "name");

  res.status(200).json({ reviews });
}));

export default router;
