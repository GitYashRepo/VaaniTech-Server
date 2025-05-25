import express, { Request, Response, NextFunction } from "express";
import { AdminModel } from "../models/admin";
import { ProductModel } from "../models/product";
import { CategoryModel } from "../models/category";
import { validateAdmin } from "../middlewares/admin";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();


// First define the JWT payload structure
interface IUserPayload {
    email: string;
    admin: boolean;
    iat: number; // 'issued at' timestamp, always added by JWT
  }

// Extend Express Request to include our custom 'user' object
interface AuthenticatedRequest extends Request {
  user?: IUserPayload;
}

// Route: Create Admin (for first time or manually)
router.get("/create", async (req: Request, res: Response) => {
  try {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash("viadmin", salt);

    const admin = new AdminModel({
      name: "Yash",
      email: "coderyashofficial1@gmail.com",
      password: hash,
      role: "admin",
    });

    await admin.save();

    console.log('JWT_SECRET value:', process.env.JWT_SECRET);

    const token = jwt.sign(
      { email: "coderyashofficial1@gmail.com", admin: true },
      process.env.JWT_SECRET as string
    );
    console.log("process.env.JWT_SECRET", process.env.JWT_SECRET);
    res.cookie("token", token);
    res.send("Admin created successfully");
  } catch (err: any) {
    res.status(500).send(err.message);
  }
});


router.get("/me", validateAdmin, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const admin = await AdminModel.findOne({ email: req.user.email }).select("-password");
    if (!admin) {
        return res.status(404).json({ message: "Admin not found" });
    }

    res.status(200).json(admin);
}));



// Route: Admin Login Page
router.get("/login", (req: Request, res: Response) => {
  res.render("admin_login");
});

// Route: Admin Login Submit for EJS
router.post("/login", (req: Request, res: Response, next: NextFunction) => {
    (async () => {
      try {
        const { email, password } = req.body;

        const admin = await AdminModel.findOne({ email });
        if (!admin) {
          return res.status(404).send("This admin is not available");
        }

        const valid = await bcrypt.compare(password, admin.password);
        if (valid) {
          const token = jwt.sign(
            { email: admin.email, admin: true },
            process.env.JWT_SECRET as string
          );
          res.cookie("token", token);
          return res.redirect("/v1/admin/dashboard");
        } else {
            return res.status(401).send("Invalid credentials");
        }
    } catch (err: any) {
        res.send(err.message);
        next(err);
    }
})();
});

// New Route: Admin Login for API (React)
router.post("/api/login", asyncHandler(async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      const admin = await AdminModel.findOne({ email });
      if (!admin) {
        return res.status(404).json({ message: "This admin is not available" });
      }

      const valid = await bcrypt.compare(password, admin.password);
      if (!valid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { email: admin.email, admin: true },
        process.env.JWT_SECRET as string,
        { expiresIn: "7d" }
      );

      res.status(200).json({ token });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  }));



// Route: Admin Dashboard
router.get("/dashboard", validateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const prodcount = await ProductModel.countDocuments();
    const categcount = await CategoryModel.countDocuments();
    res.status(200).json({ prodcount, categcount });
    // res.render("admin_dashboard", { prodcount, categcount });
  }
);

// Route: Admin Products View
router.get("/products",validateAdmin, async (req: AuthenticatedRequest, res: Response) => {
    const resultArray = await ProductModel.aggregate([
      {
        $group: {
          _id: "$category",
          products: { $push: "$$ROOT" },
        },
      },
      {
        $project: {
          _id: 0,
          category: "$_id",
          products: { $slice: ["$products", 10] },
        },
      },
    ]);

    const resultObject = resultArray.reduce(
      (acc: Record<string, any>, item) => {
        acc[item.category] = item.products;
        return acc;
      },
      {}
    );

    res.status(200).json({ products: resultObject });
    // res.render("admin_products", { products: resultObject });
  }
);

// Route: Admin Logout
router.get("/logout",validateAdmin, (req: AuthenticatedRequest, res: Response) => {
    res.clearCookie("token"); // clear token properly
    res.redirect("/v1/admin/login");
  }
);

export default router;
