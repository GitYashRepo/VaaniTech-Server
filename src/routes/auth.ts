import express, { Request, Response, NextFunction } from "express";
import passport from "passport";

const router = express.Router();

// Route to initiate Google authentication
router.get("/google", passport.authenticate("google", {
    scope: ["profile", "email"]
}));

// Google OAuth callback route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            console.error("Google authentication succeeded but no user attached");
            return res.redirect("/login?error=no-user");
        }

        req.login(req.user, (err) => {
            if (err) {
                console.error("Login error:", err);
                return next(err); // pass to Express error handler
            }
            // Redirect to frontend after successful login
            res.redirect("http://localhost:5173/profile");
        });
    }
);


// Logout route
router.get("/logout", (req: Request, res: Response, next: NextFunction) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

export default router;
