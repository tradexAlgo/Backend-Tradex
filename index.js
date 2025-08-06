import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import "./db.js";
import user from "./routes/userRoute.js";
import market from "./routes/marketRoute.js";
import admin from "./routes/adminRoute.js";
import morgan from "morgan";
import path from "path";
import fs from "fs";
import xlsx from "xlsx";
import { fileURLToPath } from 'url';  // Import fileURLToPath
import { dirname } from 'path';       // Import dirname
import userModels from "./models/user.models.js";
import "././utils/stockLive.js";
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

app.get('/export-xlsx', async (req, res) => {
  try {
      // Fetch the data from your database and use `.lean()` to remove Mongoose internal properties
      const data = await userModels.find().lean(); // Replace with your actual query to fetch data

      // Convert the data into a worksheet format
      const ws = xlsx.utils.json_to_sheet(data);

      // Create a workbook and append the worksheet to it
      const wb = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(wb, ws, 'Sheet1');

      // Set the response headers to prompt the user to download the Excel file
      res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.header('Content-Disposition', 'attachment; filename=export.xlsx');

      // Send the Excel file as a response
      const fileBuffer = xlsx.write(wb, { bookType: 'xlsx', type: 'buffer' });
      res.send(fileBuffer);
  } catch (error) {
      console.error(error);
      res.status(500).send('Server error');
  }
});


app.listen(port, () => console.log(`server listening on port ${port}`));
