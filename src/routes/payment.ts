import express, { Request, Response } from "express";
import Razorpay from "razorpay";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { CartModel } from "../models/cart";
import { PaymentModel } from "../models/payment";
import { asyncHandler } from "../utils/asyncHandler";

dotenv.config();

const router = express.Router();

// Fix session typing for passport user
declare module "express-session" {
  interface SessionData {
    passport?: {
      user: string;
    };
  }
}

// Initialize Razorpay instance
// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_KEY_ID as string,
//   key_secret: process.env.RAZORPAY_KEY_SECRET as string,
// });

// Create Razorpay Order
router.post("/create/orderId", asyncHandler(async (req: Request, res: Response) => {
  try {
    const cart = await CartModel.findOne({ user: req.session?.passport?.user });

    if (!cart) {
      return res.status(400).send("Cart not found");
    }

    const options = {
      amount: cart.totalPrice * 100, // amount in paise
      currency: "INR",
    };

    // const order = await razorpay.orders.create(options);

    // Save payment details in database
    // await PaymentModel.create({
    //   order: new mongoose.Types.ObjectId(cart._id), // Or link to Order Model later
    //   amount: order.amount,
    //   currency: order.currency,
    //   status: "created",
    //   razorpayOrderId: order.id,
    // });

    // res.status(200).send(order);
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Error creating order");
  }
}));

// Verify Razorpay Payment
router.post("/api/payment/verify", asyncHandler(async (req: Request, res: Response) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET as string;

  try {
    const { validatePaymentVerification } = require("razorpay/dist/utils/razorpay-utils");

    const result = validatePaymentVerification(
      { order_id: razorpayOrderId, payment_id: razorpayPaymentId },
      signature,
      secret
    );

    if (result) {
      const payment = await PaymentModel.findOne({ razorpayOrderId, status: "created" });

      if (!payment) {
        return res.status(404).send("Payment record not found");
      }

      payment.razorpayPaymentId = razorpayPaymentId;
      payment.status = "captured"; // or "completed"
      await payment.save();

      res.json({ status: "success" });
    } else {
      res.status(400).send("Invalid signature");
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Error verifying payment");
  }
}));

export default router;
