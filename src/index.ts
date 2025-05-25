import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import cors from 'cors';
import expressSession from "express-session";
import path from 'path';
import cookieParser from 'cookie-parser';
import passport from 'passport';

const app = express();
const PORT = process.env.PORT || 3000;

// Check env variables
if (!process.env.JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}
if (!process.env.SESSION_SECRET) {
    throw new Error('FATAL ERROR: SESSION_SECRET is not defined.');
}

// CORS FIRST
const corsOptions = {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
};
app.use(cors(corsOptions));

// Body parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use(express.static(path.join(__dirname, "../public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Cookie parser
app.use(cookieParser());

// Session (before passport)
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.SESSION_SECRET,
    cookie: {
        secure: false,
        httpOnly: true,
        sameSite: 'lax',
    },
}));

// Passport setup
import "./config/google_oauth_config"; // your Google OAuth setup
app.use(passport.initialize());
app.use(passport.session());

// Connect to DB
import { connectToDb } from "./config/db";
connectToDb();

// View engine
app.set("view engine", "ejs");

// Import routes
import { indexRouter } from "./routes/index";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";
import productRouter from "./routes/product";
import categoriesRouter from "./routes/category";
import userRouter from "./routes/user";
import cartRouter from "./routes/cart";
import paymentRouter from "./routes/payment";
import orderRouter from "./routes/order";

// Mount routes
app.use("/v1/", indexRouter);
app.use("/v1/auth", authRouter);
app.use("/v1/admin", adminRouter);
app.use("/v1/products", productRouter);
app.use("/v1/categories", categoriesRouter);
app.use("/v1/users", userRouter);
app.use("/v1/cart", cartRouter);
app.use("/v1/payment", paymentRouter);
app.use("/v1/order", orderRouter);

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
