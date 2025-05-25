import express, { Request, Response, NextFunction } from "express";
import { ProductModel } from "../models/product";
import { CategoryModel } from "../models/category";
import upload from "../config/multer_config";
import { validateAdmin, userIsLoggedIn } from "../middlewares/admin";
import { CartModel } from "../models/cart";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();


// Fix for req.session.passport
declare module "express-session" {
    interface SessionData {
        passport?: {
            user: string;
        };
    }
}

// User home page route
router.get("/", userIsLoggedIn, async (req: Request, res: Response) => {
    try {
        let somethingInCart = false;

        const resultArray = await ProductModel.aggregate([
            {
                $group: {
                    _id: "$category",
                    products: { $push: "$$ROOT" }
                }
            },
            {
                $project: {
                    _id: 0,
                    category: "$_id",
                    products: {
                        $map: {
                            input: "$products",
                            as: "product",
                            in: {
                                _id: "$$product._id",
                                name: "$$product.name",
                                price: "$$product.price",
                                stock: "$$product.stock",
                                inStock: { $gt: ["$$product.stock", 0] }
                            }
                        }
                    }
                }
            }
        ]);

        const cart = await CartModel.findOne({ user: req.session?.passport?.user });
        if (cart && cart.products.length > 0) somethingInCart = true;

        const rnproducts = await ProductModel.aggregate([{ $sample: { size: 20 } }]);

        const resultObject = resultArray.reduce((acc: Record<string, any>, item) => {
            acc[item.category] = item.products;
            return acc;
        }, {});
        res.json({
            products: resultObject,
            rnproducts,
            somethingInCart,
            cartCount: cart ? cart.products.length : 0,
        });
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// Public route to get all products (random 20)
router.get("/public", asyncHandler(async (req: Request, res: Response) => {
    try {
        const rnproducts = await ProductModel.aggregate([{ $sample: { size: 20 } }]);
        res.status(200).json(rnproducts);
    } catch (error: any) {
        res.status(500).send(error.message);
    }
}));

// Admin delete product (via POST)
router.post("/delete", validateAdmin, async (req: Request, res: Response) => {
    try {
        if (req.user?.admin) {
            await ProductModel.findOneAndDelete({ _id: req.body.product_id });
            return res.redirect("back");
        }
        res.status(403).send("You are not allowed to delete this product");
    } catch (error: any) {
        res.status(500).send(error.message);
    }
});

// Admin reduce stock by 1
router.patch(
    "/reduce-stock/:id",
    validateAdmin,
    asyncHandler(async (req: Request, res: Response) => {
      if (req.user?.admin) {
        const product = await ProductModel.findById(req.params.id);
        if (!product) return res.status(404).send("Product not found");

        if (product.stock > 0) {
          product.stock -= 1;
          await product.save();
          res.status(200).send("Stock reduced by 1");
        } else {
          res.status(400).send("Stock is already 0");
        }
      } else {
        res.status(403).send("You are not allowed to change the stock of a product");
      }
    })
  );

// Anyone (Admin) add stock
router.patch("/add-stock/:productId", asyncHandler(async (req: Request, res: Response) => {
    try {
        const { productId } = req.params;
        const product = await ProductModel.findById(productId);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }
        product.stock += 1;
        await product.save();
        res.status(200).json({ message: "Stock added successfully", product });
    } catch (error: any) {
        res.status(500).json({ message: "Error adding stock", error: error.message });
    }
}));


// 🛠 Now Add a New Route in your product.ts
router.post("/update-fields/:id", validateAdmin, asyncHandler(async (req: Request, res: Response) => {
    const { price, stock } = req.body;
    const product = await ProductModel.findById(req.params.id);

    if (!product) {
      return res.status(404).send("Product not found");
    }

    product.price = Number(price);
    product.stock = Number(stock);
    await product.save();

    // res.redirect("back");
    res.status(200).json({ message: "Product updated successfully" });

  }));



// Admin add new product (with multiple image upload)
router.post("/", upload.array("images", 8), asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, price, category, stock, description } = req.body;

      if (!name || !price || !category || stock === undefined) {
        return res.status(400).send("Missing required fields");
      }

      if (!req.files || !(req.files instanceof Array) || req.files.length === 0) {
        return res.status(400).send("At least one image is required");
      }

      let isCategory = await CategoryModel.findOne({ name: category });
      if (!isCategory) {
        await CategoryModel.create({ name: category });
      }

      // Map all uploaded image filenames
      const imageFilenames = req.files.map((file: Express.Multer.File) => file.filename);

      await ProductModel.create({
        name,
        price,
        category,
        stock,
        description,
        images: imageFilenames, // Save multiple images
      });

      res.redirect("/v1/admin/dashboard");

    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }));


  //get the product:-
  router.get("/edit/:id", validateAdmin, asyncHandler(async (req: Request, res: Response) => {
    try {
      const product = await ProductModel.findById(req.params.id);
      if (!product) {
        return res.status(404).send("Product not found");
      }
      const categories = await CategoryModel.find(); // to show categories dropdown
    //   res.render("admin_edit_products", { product, categories });
    res.status(200).json({ product, categories });
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }));

  // update the products
  router.post("/update/:id", validateAdmin, upload.array("images", 8), asyncHandler(async (req: Request, res: Response) => {
    try {
      const { name, price, category, stock, description } = req.body;
      const product = await ProductModel.findById(req.params.id);

      if (!product) {
        return res.status(404).send("Product not found");
      }

      product.name = name;
      product.price = Number(price);
      product.category = category;
      product.stock = Number(stock);
      product.description = description;

      const files = req.files as Express.Multer.File[];
      if (files && files.length > 0) {
            const imageFilenames = files.map(file => file.filename);
            product.images = imageFilenames;
      }


      await product.save();
      res.redirect("/v1/admin/products");
    // res.status(200).json({ message: "Product updated successfully", product});
    } catch (error: any) {
      res.status(500).send(error.message);
    }
  }));



export default router;
