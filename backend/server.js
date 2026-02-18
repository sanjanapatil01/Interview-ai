// const express = require("express");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const connectDB = require("./config/db");
// const authRoutes = require("./routes/auth");
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.js";
dotenv.config();
connectDB();

const app = express();
// const corsOptions = {
//     origin: ['http://localhost:3000','http://localhost:3001','https://rwdtwzmr-3001.inc1.devtunnels.ms','https://rwdtwzmr-3001.inc1.devtunnels.ms/'], // Only allow your frontend's origin
//     methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],

//     credentials: true, // If you're using cookies/sessions
// };

app.use(cors());
app.use(express.json());

app.use("/api", authRoutes);

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
