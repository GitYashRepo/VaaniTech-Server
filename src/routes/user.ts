import express, { Request, Response, NextFunction } from "express";
import { userModel } from "../models/user";

const router = express.Router();


router.get("/me", (req: Request, res: Response) => {
    if (req.isAuthenticated()) {
        res.json(req.user);
    } else {
        res.status(401).json({ message: "Not authenticated" });
    }
});

// Render login page
router.get("/login", (req: Request, res: Response) => {
    res.render("user_login");
});

// User profile page
router.get("/profile", (req: Request, res: Response) => {
    res.send("profile page");
});

// Logout route
router.get("/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        req.session.destroy((destroyErr) => {
            if (destroyErr) {
                return next(destroyErr);
            }
            res.clearCookie("connect.sid");
            res.redirect("/users/login");
        });
    });
});

export default router;
