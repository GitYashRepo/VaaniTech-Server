import express, { Request, Response } from "express";
import { CategoryModel } from "../models/category";
import { ProductModel } from "../models/product";
import { validateAdmin } from "../middlewares/admin";
import { asyncHandler } from "../utils/asyncHandler";
import upload from "../config/multer_config";


const router = express.Router();

// Create a new Category (with duplicate check)
router.post("/create",validateAdmin,upload.single("image"),asyncHandler(async (req: Request, res: Response) => {
      const { name } = req.body;
      const file = req.file;
      if (!name || !file) {
        return res.status(400).send("Both name and image are required");
      }
      const existing = await CategoryModel.findOne({
        name: { $regex: new RegExp("^" + name + "$", "i") },
      });
      if (existing) {
        return res.status(400).send("Category already exists");
      }
      await CategoryModel.create({
        name,
        image: file.filename,
      });
      res.redirect("/v1/admin/dashboard");
    })
);




// Get all Categories
router.get("/getcateg", validateAdmin, asyncHandler(async (req: Request, res: Response) => {
  const categories = await CategoryModel.find({}, "_id name");
  res.json({ categories });
}));



// Delete Category with safety check
router.post("/delete/categ", validateAdmin, asyncHandler(async (req: Request, res: Response) => {
  if (!req.user?.admin) {
    return res.status(403).send("You are not allowed to delete this category");
  }
  const { category_id } = req.body;
  if (!category_id) {
    return res.status(400).send("Category ID is required");
  }
  const category = await CategoryModel.findById(category_id);
  if (!category) {
    return res.status(404).send("Category not found");
  }
  const products = await ProductModel.find({ category: category._id });
  if (products.length > 0) {
    return res.status(400).send("Cannot delete category as it has products associated with it.");
  }
  await CategoryModel.findByIdAndDelete(category_id);
  res.redirect("/admin/dashboard");
}));

export default router;
