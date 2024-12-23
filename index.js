import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import "./db.js";
import user from "./routes/userRoute.js";
import market from "./routes/marketRoute.js";
import admin from "./routes/adminRoute.js";
import morgan from "morgan";
import path from "path";
import { fileURLToPath } from 'url';  // Import fileURLToPath
import { dirname } from 'path';       // Import dirname

dotenv.config();

const app = express();

app.use(express.json());

app.use(morgan("tiny"));

morgan.token("host", function (req, res) {
  return req.hostname;
});

app.use(cors());

// Define __dirname using fileURLToPath and dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const port = process.env.PORT || 5001;

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/user", user);
app.use("/market", market);
app.use("/admin", admin);

app.listen(port, () => console.log(`server listening on port ${port}`));
