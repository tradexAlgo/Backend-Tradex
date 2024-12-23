import Admin from "../models/admin.models.js";
import jwt from "jsonwebtoken";
import responseHelper from "../helpers/response.helper.js";
import hashPassword from "../middleware/hashPassword.js";
import { MESSAGE } from "../helpers/message.helper.js";
import Stock from "../models/stock.models.js";
import User from "../models/user.models.js";
import Commodity from "../models/commodity.models.js";
import introModels from "../models/intro.models.js";
import mongoose from "mongoose";
const { send200, send403, send400, send401, send404, send500 } = responseHelper;

// Login for Super Admin
const loginSuperAdmin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return send400(res, {
      status: false,
      message: MESSAGE.FIELDS_REQUIRED,
    });
  }

  try {
    const admin = await Admin.findOne({ email });

    if (!admin || admin.role !== "SUPER_ADMIN") {
      return send404(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }

    const validPass = await hashPassword.compare(password, admin.password);

    if (!validPass) {
      return send400(res, {
        status: false,
        message: MESSAGE.LOGIN_ERROR,
      });
    }

    const token = jwt.sign(
      { _id: admin._id },
      process.env.JWT_SECRET
    );

    res.header("auth-token", token).status(200).json({
      status: true,
      token,
      message: MESSAGE.LOGIN_SUCCESS,
      data: admin,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Create a Super Admin
const createSuperAdmin = async (req, res) => {
  const { email, fullName, password } = req.body;

  try {
    if (!email || !fullName || !password) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    // Ensure that the Super Admin account doesn't already exist
    const existingAdmin = await Admin.findOne({ role: "SUPER_ADMIN" });
    if (existingAdmin) {
      return send400(res, {
        status: false,
        message: MESSAGE.SUPER_ADMIN_EXISTS,
      });
    }

    // Encrypt the password
    const encryptedPassword = await hashPassword.encrypt(password);

    // Create the Super Admin
    const newAdmin = new Admin({
      email,
      fullName,
      password: encryptedPassword,
      role: "SUPER_ADMIN",
    });

    const admin = await newAdmin.save();

    res.status(201).json({
      status: true,
      message: MESSAGE.SUPER_ADMIN_CREATED,
      data: admin,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Create a Sub-Admin
const createSubAdmin = async (req, res) => {
  const { email, fullName, password } = req.body;

  try {
    if (!email || !fullName || !password) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    const adminExists = await Admin.findOne({ email });

    if (adminExists) {
      return send400(res, {
        status: false,
        message: MESSAGE.USER_EXISTS,
      });
    }

    const encryptedPassword = await hashPassword.encrypt(password);

    const newAdmin = new Admin({
      email,
      fullName,
      password: encryptedPassword,
      role: "SUB_ADMIN",
    });

    const admin = await newAdmin.save();

    res.status(201).json({
      status: true,
      message: MESSAGE.ADMIN_CREATED,
      data: admin,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Get All Admins
const getAllAdmins = async (req, res) => {
  try {
    const admins = await Admin.find();
    res.status(200).json({
      status: true,
      message: MESSAGE.ADMINS_FETCHED,
      data: admins,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Update Admin Status (Activate/Deactivate)
const updateAdminStatus = async (req, res) => {
  const { adminId } = req.params;
  const { status } = req.body; // Expected to be a boolean or string like "active" / "inactive"

  try {
    if (!status) {
      return send400(res, {
        status: false,
        message: MESSAGE.STATUS_REQUIRED,
      });
    }

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { status },
      { new: true }
    );

    if (!updatedAdmin) {
      return send404(res, {
        status: false,
        message: MESSAGE.ADMIN_NOT_FOUND,
      });
    }

    res.status(200).json({
      status: true,
      message: MESSAGE.STATUS_UPDATED,
      data: updatedAdmin,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Reset Admin Password
const resetAdminPassword = async (req, res) => {
  const { adminId } = req.params;
  const { newPassword } = req.body;

  try {
    if (!newPassword) {
      return send400(res, {
        status: false,
        message: MESSAGE.PASSWORD_REQUIRED,
      });
    }

    const encryptedPassword = await hashPassword.encrypt(newPassword);

    const updatedAdmin = await Admin.findByIdAndUpdate(
      adminId,
      { password: encryptedPassword },
      { new: true }
    );

    if (!updatedAdmin) {
      return send404(res, {
        status: false,
        message: MESSAGE.ADMIN_NOT_FOUND,
      });
    }

    res.status(200).json({
      status: true,
      message: MESSAGE.PASSWORD_RESET,
      data: updatedAdmin,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Delete an Admin
const deleteAdmin = async (req, res) => {
  const { adminId } = req.params;

  try {
    const deletedAdmin = await Admin.findByIdAndDelete(adminId);

    if (!deletedAdmin) {
      return send404(res, {
        status: false,
        message: MESSAGE.ADMIN_NOT_FOUND,
      });
    }

    res.status(200).json({
      status: true,
      message: MESSAGE.ADMIN_DELETED,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Get Dashboard Info
const getDashboardInfo = async (req, res) => {
  try {
    // Get top 10 stocks by totalAmount
    const topStocks = await Stock.find()
      .sort({ totalAmount: -1 })
      .limit(10)
      .select('stockName symbol totalAmount');

    // Get latest 5 users by joinedOn date
    const latestUsers = await User.find()
      .sort({ joinedOn: -1 })
      .limit(5)
      .select('fullName email joinedOn userPicture');

    // Get total number of stocks and commodities
    const totalStocks = await Stock.countDocuments();
    const totalCommodities = await Commodity.countDocuments();
    const totalUsers = await User.countDocuments();

    // Get total invested amount from all users
    const totalInvested = await User.aggregate([
      { $group: { _id: null, total: { $sum: "$totalInvested" } } }
    ]);

    // Get total profit and loss from all stocks
    const totalStockProfitLoss = await Stock.aggregate([
      { $group: { _id: null, totalProfitLoss: { $sum: "$netProfitAndLoss" } } }
    ]);

    // Get last updated stock
    const lastUpdatedStock = await Stock.findOne()
      .sort({ updatedAt: -1 })
      .select('stockName symbol updatedAt');

    // Get total value of all stocks
    const totalStockValue = await Stock.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$stockPrice"] } } } }
    ]);

    // Get total value of all commodities
    const totalCommodityValue = await Commodity.aggregate([
      { $group: { _id: null, totalValue: { $sum: { $multiply: ["$quantity", "$commodityPrice"] } } } }
    ]);

    // Get user with highest wallet
    const userWithHighestWallet = await User.findOne()
      .sort({ wallet: -1 })
      .select('fullName email wallet');

    // Get number of stocks by status
    const stocksByStatus = await Stock.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    res.status(200).json({
      status: true,
      message: MESSAGE.DASHBOARD_INFO_FETCHED,
      data: {
        topStocks,
        latestUsers,
        totalStocks,
        totalCommodities,
        totalUsers,
        totalInvested: totalInvested[0]?.total || 0,
        totalStockProfitLoss: totalStockProfitLoss[0]?.totalProfitLoss || 0,
        lastUpdatedStock,
        totalStockValue: totalStockValue[0]?.totalValue || 0,
        totalCommodityValue: totalCommodityValue[0]?.totalValue || 0,
        userWithHighestWallet,
        stocksByStatus
      }
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Get All Stocks
const getAllStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.status(200).json({
      status: true,
      message: "Stocks fetched successfully.",
      data: stocks,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Edit Stock
const editStock = async (req, res) => {
  const { stockId } = req.params;
  const { stockName, symbol, totalAmount, stockType, userId, type, quantity, targetPrice, stockPrice, stopLoss, status, netProfitAndLoss, soldDate, buyDate, squareOff, squareOffDate, intervalId, executed, failed, toSquareOffOn, expiryDate, optionType, identifier } = req.body;

  try {
    const updatedStock = await Stock.findByIdAndUpdate(
      stockId,
      {
        stockName, symbol, totalAmount, stockType, userId, type, quantity, targetPrice, stockPrice, stopLoss, status, netProfitAndLoss, soldDate, buyDate, squareOff, squareOffDate, intervalId, executed, failed, toSquareOffOn, expiryDate, optionType, identifier
      },
      { new: true }
    );

    if (!updatedStock) {
      return send404(res, {
        status: false,
        message: "Stock not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Stock updated successfully.",
      data: updatedStock,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Delete Stock
const deleteStock = async (req, res) => {
  const { stockId } = req.params;

  try {
    const deletedStock = await Stock.findByIdAndDelete(stockId);

    if (!deletedStock) {
      return send404(res, {
        status: false,
        message: "Stock not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Stock deleted successfully.",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Get All Commodities
const getAllCommodities = async (req, res) => {
  try {
    // Step 1: Find all commodities
    const commodities = await Commodity.find();

    // Step 2: Extract userIds from commodities
    const userIds = [...new Set(commodities.map(commodity => commodity.userId))];

    // Step 3: Fetch user details for each userId
    const users = await User.find({ _id: { $in: userIds } }).select('email fullName');

    // Create a map of user details for easy access
    const userMap = users.reduce((acc, user) => {
      acc[user._id] = user;
      return acc;
    }, {});

    // Step 4: Combine data and send response
    const response = commodities.map(commodity => ({
      ...commodity.toObject(),
      user: userMap[commodity.userId] ? {
        email: userMap[commodity.userId].email,
        name: userMap[commodity.userId].fullName,
      } : null,
    }));

    res.status(200).json({
      status: true,
      message: "Commodities fetched successfully.",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};



// Edit Commodity
const editCommodity = async (req, res) => {
  const { commodityId } = req.params;
  const { commodityName, symbol, totalAmount, type, userId, quantity, targetPrice, commodityPrice, stopLoss, status, netProfitAndLoss, buyDate, sellDate, squareOff, squareOffDate, intervalId, executed, failed, toSquareOffOn } = req.body;

  try {
    const updatedCommodity = await Commodity.findByIdAndUpdate(
      commodityId,
      {
        commodityName, symbol, totalAmount, type, userId, quantity, targetPrice, commodityPrice, stopLoss, status, netProfitAndLoss, buyDate, sellDate, squareOff, squareOffDate, intervalId, executed, failed, toSquareOffOn
      },
      { new: true }
    );

    if (!updatedCommodity) {
      return send404(res, {
        status: false,
        message: "Commodity not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Commodity updated successfully.",
      data: updatedCommodity,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Delete Commodity
const deleteCommodity = async (req, res) => {
  const { commodityId } = req.params;

  try {
    const deletedCommodity = await Commodity.findByIdAndDelete(commodityId);

    if (!deletedCommodity) {
      return send404(res, {
        status: false,
        message: "Commodity not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "Commodity deleted successfully.",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};
// Get All Users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find();
    res.status(200).json({
      status: true,
      message: "Users fetched successfully.",
      data: users,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// Update User
// const updateUser = async (req, res) => {
//   const { userId } = req.params;
//   const {
//     role, email, fullName, password, wallet, overallProfit, todayProfit,
//     userPicture, totalInvested, otp, isProfileComplete, currency,
//     joinedOn, profileStatus, phoneNumber, isPhoneNumberVerified
//   } = req.query; // Extracting data from query parameters


//   const updateFields = {};

//   // Only include fields that are defined in req.query
//   const allowedFields = [
//     'role', 'email', 'fullName', 'password', 'wallet', 'overallProfit',
//     'todayProfit', 'userPicture', 'totalInvested', 'otp', 'isProfileComplete',
//     'currency', 'joinedOn', 'profileStatus', 'phoneNumber', 'isPhoneNumberVerified'
//   ];

//   allowedFields.forEach(field => {
//     if (req.query[field] !== undefined && req.query[field] !== 'null') {
//       // Convert string 'null' to actual null if necessary
//       updateFields[field] = req.query[field] === 'null' ? null : req.query[field];
//     }
//   });

//   try {
//     const updatedUser = await User.findByIdAndUpdate(
//       userId,
//       { $set: updateFields },
//       { new: true }
//     );

//     if (!updatedUser) {
//       return res.status(404).json({
//         status: false,
//         message: "User not found.",
//       });
//     }

//     res.status(200).json({
//       status: true,
//       message: "User updated successfully.",
//       data: updatedUser,
//     });
//   } catch (error) {
//     console.error("Update error:", error); // Log the error for debugging
//     return res.status(500).json({
//       status: false,
//       message: error.message,
//     });
//   }
// };

const updateUser = async (req, res) => {
  const { userId } = req.params;
   const {
     role,
     email,
     fullName,
     password,
     wallet,
     overallProfit,
     todayProfit,
     userPicture,
     totalInvested,
     otp,
     isProfileComplete,
     currency,
     joinedOn,
     profileStatus,
     phoneNumber,
     isPhoneNumberVerified,
   } = req.body; // Extracting data from body

 console.log("User ID:", userId);
 console.log("Headers:", req.headers);
 console.log("Received body data:", req.body);


  const updateFields = {};
  const allowedFields = [
    "role",
    "email",
    "fullName",
    "password",
    "wallet",
    "overallProfit",
    "todayProfit",
    "userPicture",
    "totalInvested",
    "otp",
    "isProfileComplete",
    "currency",
    "joinedOn",
    "profileStatus",
    "phoneNumber",
    "isPhoneNumberVerified",
  ];

  allowedFields.forEach((field) => {
    if (
      req.body[field] !== undefined &&
      req.body[field] !== "" &&
      req.body[field] !== "null"
    ) {
      updateFields[field] = req.body[field] === "null" ? null : req.body[field];
    }
  });

  console.log("Received query:", req.body);
  console.log("Update Fields:", updateFields);

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ status: false, message: "Invalid userId." });
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "User updated successfully.",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Update error:", error);
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};




// Delete User
const deleteUser = async (req, res) => {
  const { userId } = req.params;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return send404(res, {
        status: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      status: true,
      message: "User deleted successfully.",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};



// Add intro details
const addIntroDetails = async (req, res) => {
  try {
    const { introTitle, introDescription, introHashtags, introBanner } = req.body;
    const newIntro = new introModels({ introTitle, introDescription, introHashtags, introBanner });
    const savedIntro = await newIntro.save();
    res.status(201).json(savedIntro);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update intro details
const updateIntroDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { introTitle, introDescription, introHashtags, introBanner } = req.body;
    const updatedIntro = await introModels.findByIdAndUpdate(
      id,
      { introTitle, introDescription, introHashtags, introBanner },
      { new: true }
    );
    if (!updatedIntro) return res.status(404).json({ message: "Intro not found" });
    res.json(updatedIntro);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAllIntroDetails = async (req, res) => {
  try {
    const introDetails = await introModels.find(); // Fetch all intro details
    res.json(introDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//delete intro api
const deleteIntroDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedIntro = await introModels.findByIdAndDelete(id); // Delete intro detail by ID
    if (!deletedIntro) return res.status(404).json({ message: "Intro not found" });
    res.json({ message: "Intro deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// Upload intro banner image
export const uploadIntroImage = (req, res) => {
  console.log('Request Headers:', req.headers);
  console.log('Request Body:', req.body);
  console.log('File:', req.file);
  
  if (!req.file) {
    return res.status(400).send('No file uploaded.');
  }
  
  const fileUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({
    message: 'File uploaded successfully',
    fileUrl: fileUrl
  });
};




const adminController = {
  loginSuperAdmin,
  createSuperAdmin,  // Export createSuperAdmin
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
  updateUser,
  deleteUser,
  addIntroDetails,
  updateIntroDetails,
  uploadIntroImage,
  getAllIntroDetails,
  deleteIntroDetails
};

export default adminController;
