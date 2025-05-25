import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();


// Define the JWT payload structure
interface IUserPayload {
    email: string;
    admin: boolean;
    iat: number;
    exp?: number;
}

// Correct way: Extend Express.User, NOT Express.Request
declare global {
    namespace Express {
        interface User extends IUserPayload {}
    }
}

// Middleware to validate Admin by checking JWT token
export function validateAdmin(req: Request, res: Response, next: NextFunction): void {
    // Try token from cookie first
    let token = req.cookies?.token;

    // If not found, try token from Authorization header
    if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
        res.status(401).send("You need to login first");
        return;
    }

    try {
        const data = jwt.verify(token, process.env.JWT_SECRET as string) as IUserPayload;
        req.user = data;
        next();
    } catch (err: any) {
        res.status(401).send(err.message || "Invalid token");
    }
}


// Middleware to check if normal user is logged in (passport authentication)
export function userIsLoggedIn(req: Request, res: Response, next: NextFunction): void {
    if (req.isAuthenticated && req.isAuthenticated()) {
        next();
    } else {
        res.redirect("/users/login");
    }
}
