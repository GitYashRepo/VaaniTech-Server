import express, { Request, Response } from "express";
import { CartModel } from "../models/cart";
import { ProductModel } from "../models/product";
import { userIsLoggedIn } from "../middlewares/admin";
import { asyncHandler } from "../utils/asyncHandler";
import mongoose from "mongoose";

import { Document, Types } from "mongoose";

export interface IProduct extends Document {
    _id: Types.ObjectId;
    name: string;
    description: string;
    price: number;
    image: string;
    // add other fields if needed
}


const router = express.Router();

// Fix session typing for passport user
declare module "express-session" {
  interface SessionData {
    passport?: {
      user: string;
    };
  }
}

// Extend the cart product type to include populated product data
interface ICartProductPopulated {
    product: Types.ObjectId | IProduct;
    quantity: number;
}


// Get Cart Page my code
// router.get("/", userIsLoggedIn, asyncHandler(async (req: Request, res: Response) => {
//   try {
//     const cart = await CartModel.findOne({ user: req.session?.passport?.user }).populate("products.product");

//     if (!cart) {
//       return res.status(404).send("No cart found for this user");
//     }

//     const CartDataStructure: Record<string, any> = {};

//     cart.products.forEach((product: any) => {
//       const key = product._id.toString();
//       if (CartDataStructure[key]) {
//         CartDataStructure[key].quantity += 1;
//       } else {
//         CartDataStructure[key] = {
//           ...product._doc,
//           quantity: 1,
//         };
//       }
//     });

//     const finalArray = Object.values(CartDataStructure);
//     const finalPrice = cart.totalPrice;

//     res.status(200).json({
//       cart: finalArray,
//       finalprice: finalPrice,
//       userid: req.session.passport?.user,
//     });
//   } catch (error: any) {
//     res.status(500).send(error.message);
//   }
// }));

// Chat GPT Code:-
router.get(
    "/",
    userIsLoggedIn,
    asyncHandler(async (req: Request, res: Response) => {
        try {
            const cart = await CartModel.findOne({ user: req.session?.passport?.user })
                .populate("products.product")

            if (!cart) {
                return res.status(404).send("No cart found for this user");
            }

            const cartProducts = cart.products as ICartProductPopulated[];

            const finalArray = [];

            for (const item of cartProducts) {
                // Skip if product is not populated
                if (!item.product || item.product instanceof Types.ObjectId) {
                    continue;
                }

                finalArray.push({
                    _id: item.product._id,
                    name: item.product.name,
                    description: item.product.description,
                    price: item.product.price,
                    images: item.product.image,
                    quantity: item.quantity,
                });
            }

            res.status(200).json({
                cart: finalArray,
                finalprice: cart.totalPrice,
                userid: req.session.passport?.user,
            });
        } catch (error: any) {
            console.error("Error fetching cart:", error);
            res.status(500).send("An error occurred while fetching the cart");
        }
    })
);

// Add Product to Cart
router.post("/add/:id", userIsLoggedIn, asyncHandler(async (req: Request, res: Response) => {
  try {
    const cart = await CartModel.findOne({ user: req.session?.passport?.user });
    const product = await ProductModel.findById(req.params.id);

    if (!req.params.id || req.params.id === 'undefined') {
        return res.status(400).send('Invalid product ID');
    }

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const productId = new mongoose.Types.ObjectId(req.params.id);

    if (!cart) {
      await CartModel.create({
        user: req.session?.passport?.user,
        products: [{ product: productId, quantity: 1 }],
        totalPrice: Number(product.price),
      });
    } else {
      cart.products.push({ product: productId, quantity: 1 });
      cart.totalPrice = Number(cart.totalPrice) + Number(product.price);
      await cart.save();
    }

    // res.redirect("back");
    res.status(200).json({ message: 'Product added to cart' });
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}));

// Remove Product from Cart
router.get("/remove/:id", userIsLoggedIn, asyncHandler(async (req: Request, res: Response) => {
  try {
    const cart = await CartModel.findOne({ user: req.session?.passport?.user });
    const product = await ProductModel.findById(req.params.id);

    if (!cart) {
      return res.status(404).send("Cart not found");
    }

    if (!product) {
      return res.status(404).send("Product not found");
    }

    const productId = new mongoose.Types.ObjectId(req.params.id);

    const index = cart.products.findIndex(p => p.product.equals(productId));
    if (index === -1) {
      return res.status(404).send("Product not in cart");
    }

    cart.products.splice(index, 1);
    cart.totalPrice = Number(cart.totalPrice) - Number(product.price);

    await cart.save();

    product.stock += 1; // add back to stock
    await product.save();

    res.redirect("back");
  } catch (error: any) {
    res.status(500).send(error.message);
  }
}));

export default router;
