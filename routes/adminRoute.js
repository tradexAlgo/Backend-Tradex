import express from "express";
import path from "path";
import fs from "fs";
import adminController from "../controller/adminController.js";
import Busboy from 'busboy';
import { dirname } from 'path';
const router = express.Router();
const {
  loginSuperAdmin,
  createSuperAdmin,
  createSubAdmin,
  getAllAdmins,
  updateAdminStatus,
  resetAdminPassword,
  deleteAdmin,
  getDashboardInfo,
  getAllStocks,
  editStock,
  deleteStock,
  getAllCommodities,
  editCommodity,
  deleteCommodity,
  getAllUsers,
  newUser,
  updateUser,
  deleteUser,
  addIntroDetails,
  updateIntroDetails,
  getAllIntroDetails,
  deleteIntroDetails,
  createStock,
  updateStatus,
   createBroker,
  getBrokers,
  deleteBroker,
  updateBroker
} = adminController;



// Only Super Admin can manage brokers
router.post('/broker', createBroker);
router.get('/brokers', getBrokers);
router.delete('/broker/:brokerId',  deleteBroker);
router.post("/update-broker/:brokerId", updateBroker);

// Route for Super Admin login
router.post("/login", loginSuperAdmin);

// Route for creating a Super Admin (use with caution, ideally during initial setup only)
router.post("/create-super-admin", createSuperAdmin);

// Route for creating a Sub-Admin (only Super Admin can do this)
router.post("/create-sub-admin", createSubAdmin);

// Route for getting all admins (Super Admin access only)
router.get("/admins", getAllAdmins);

// Route for updating admin status (activate/deactivate)
router.put("/update-status/:adminId", updateAdminStatus);

// Route for resetting an admin's password (Super Admin access only)
router.put("/reset-password/:adminId", resetAdminPassword);

// Route for deleting an admin (Super Admin access only)
router.delete("/delete-admin/:adminId", deleteAdmin);

// Route for getting dashboard information (Super Admin access only)
router.get("/dashboard-info", getDashboardInfo);

// Stock Management Routes
router.post("/stocks", createStock)
router.get("/stocks", getAllStocks); // Get all stocks
router.put("/stocks/:stockId", editStock); // Update stock
router.delete("/stocks/:stockId", deleteStock); // Delete stock

// Commodity Management Routes
router.get("/commodities", getAllCommodities); // Get all commodities
router.put("/commodities/:commodityId", editCommodity); // Update commodity
router.delete("/commodities/:commodityId", deleteCommodity); // Delete commodity

// User Management Routes
router.post("/users", newUser);
router.get("/users", getAllUsers); // Get all users
router.put("/users/:userId", updateUser); // Update user
router.post("/users/:userId/status", updateStatus); // Update user Active
router.delete("/users/:userId", deleteUser); // Delete user

// App Intro Routes
router.post("/intro/add", addIntroDetails); // Add intro details
router.put("/intro/update/:id", updateIntroDetails); // Update intro details
router.get('/intro', getAllIntroDetails); 
router.delete('/intro/:id', deleteIntroDetails);

router.post('/intro/upload-image', (req, res) => {
  const bb = new Busboy({ headers: req.headers });
  const uploadPath = path.join('__dirname', '..', 'uploads');

  bb.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const filePath = path.join(uploadPath, `${Date.now()}${path.extname(filename)}`);
    file.pipe(fs.createWriteStream(filePath));
    
    file.on('end', () => {
      console.log(`File ${filename} uploaded successfully.`);
      const fileUrl = `/uploads/${path.basename(filePath)}`;
      res.status(200).json({ message: 'File uploaded successfully.', fileUrl });
    });
  });

  bb.on('finish', () => {
    // No need to send a response here as it is handled in the 'file' event
  });

  req.pipe(bb);
});

export default router;
