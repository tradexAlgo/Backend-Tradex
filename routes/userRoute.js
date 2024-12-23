import express from "express";
const router = express.Router();
import userController from "../controller/userController.js";
import verifyToken from "../utils/verifyToken.js";
const { register, sendOtp, verifyOtp, getUserProfile, login,getIntro,depositRequest,withdrawRequest,acceptRequest,getPaymentRequests,addOrUpdatePaymentInfo,getPaymentInfo } = userController;

router.post("/register", register);
// router.post("/sendotp", sendOtp);
router.post("/sendotp", verifyToken, sendOtp);
router.post("/verifyotp", verifyToken, verifyOtp);
router.get("/getuserprofile", verifyToken, getUserProfile);
router.post("/login", login);
router.get("/getIntro", getIntro);

router.post("/deposit", depositRequest);
router.post("/withdraw", withdrawRequest);
router.post("/accept", acceptRequest);
router.get("/payments", getPaymentRequests);

// Route to add/update payment information
router.post('/payment-info', addOrUpdatePaymentInfo);

// Route to get payment information
router.get('/payment-info', getPaymentInfo);


export default router;
