import express, { Request, Response } from "express";
import { PaymentModel } from "../models/payment";
import { OrderModel } from "../models/order";
import { CartModel } from "../models/cart";
import { ProductModel } from "../models/product";
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();

// Fix session typing for passport user
declare module "express-session" {
  interface SessionData {
    passport?: {
      user: string;
    };
  }
}

// Confirm Order after Payment
router.get("/:userid/:orderid/:paymentid/:signature", asyncHandler(async (req: Request, res: Response) => {
  try {
    const { userid, orderid, paymentid, signature } = req.params;

    const paymentDetails = await PaymentModel.findOne({ razorpayOrderId: orderid });

    if (!paymentDetails) {
      return res.status(404).send("Sorry, this order does not exist!");
    }

    // Validate payment status
    if (paymentDetails.status !== "captured") {
      return res.status(400).send("Payment is not captured yet");
    }

    // Validate signature and paymentId
    if (signature !== paymentDetails.signature || paymentid !== paymentDetails.razorpayPaymentId) {
      return res.status(400).send("Invalid Payment Signature");
    }

    const cart = await CartModel.findOne({ user: userid });

    if (!cart) {
      return res.status(404).send("Cart not found for this user");
    }

    const outOfStockProducts: string[] = [];

    // Check stock availability
    for (const productEntry of cart.products) {
      const productId = (productEntry as any).product || productEntry;
      const product = await ProductModel.findById(productId);
      if (product && product.stock <= 0) {
        outOfStockProducts.push(product.name);
      }
    }

    if (outOfStockProducts.length > 0) {
      return res.status(400).send(
        `The following products are out of stock: ${outOfStockProducts.join(", ")}`
      );
    }

    // Bulk update stock for all products
    const bulkOps = cart.products.map(productEntry => {
      const productId = (productEntry as any).product || productEntry;
      return {
        updateOne: {
          filter: { _id: productId },
          update: { $inc: { stock: -1 } }
        }
      };
    });

    await ProductModel.bulkWrite(bulkOps);

    // Create the order
    await OrderModel.create({
      orderId: orderid,
      user: userid,
      products: cart.products,
      totalPrice: cart.totalPrice,
      status: "processing",
      payment: paymentDetails._id,
    });

    // Clear the cart
    await CartModel.findByIdAndDelete(cart._id);

    res.redirect("/products");
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Server error");
  }
}));

// Save address to Order
router.post("/address/:orderid", asyncHandler(async (req: Request, res: Response) => {
  try {
    const { orderid } = req.params;
    const { address } = req.body;

    const order = await OrderModel.findOne({ orderId: orderid });

    if (!order) {
      return res.status(404).send("Sorry, this order does not exist");
    }

    if (!address) {
      return res.status(400).send("You must provide an address");
    }

    order.address = address;
    await order.save();

    res.redirect("/");
  } catch (error: any) {
    console.error(error);
    res.status(500).send("Server error");
  }
}));

export default router;
