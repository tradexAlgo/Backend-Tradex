import User from "../models/user.models.js";
import jwt from "jsonwebtoken";
import responseHelper from "../helpers/response.helper.js";
import hashPassword from "../middleware/hashPassword.js";
import { MESSAGE } from "../helpers/message.helper.js";
import generateOtp from "../utils/generateOtp.js";
import Fast2SendOtp from "../utils/Fast2SendOtp.js";
import validateFields from "../middleware/validateFields.js";
import watchList from "../models/watchList.models.js";
import nodemailer from 'nodemailer';
import { google } from 'googleapis';
import introModels from "../models/intro.models.js";
import userPaymentModels from "../models/userPayment.models.js";
import paymentInfoModels from "../models/paymentInfo.models.js";
import oAuth2Client from "../services/oauthClient.js";
const { send200, send403, send400, send401, send404, send500 } = responseHelper;

const register = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }
    const userExists = await User.findOne({ email });
    if (userExists) {
      return send400(res, {
        status: false,
        message: MESSAGE.USER_EXISTS,
      });
    }
    const encryptedPassword = await hashPassword.encrypt(password);
    const newUser = new User({
      fullName,
      email,
      password: encryptedPassword,
    });
    const user = await newUser.save();
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET
    );

    res
      .header("auth-token", token)
      .status(201)
      .json({
        status: true,
        token: token,
        message: `${MESSAGE.USER_REGISTERED}. ${MESSAGE.VERIFY_NUMBER}`,
        data: user,
      });
  } catch (error) {
    return send400(res, {
      status: false,
      message: error.message,
    });
  }
};
const validateEmail = (email) => {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@(([^<>()[\]\.,;:\s@"]+\.)+[^<>()[\]\.,;:\s@"]{2,})$/i;
  return re.test(String(email).toLowerCase());
};
const CLIENT_ID =
  "497105170769-jovr105n48s95l213oq6n470el356ml1.apps.googleusercontent.com";
const CLIENT_SECRET = "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";
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN =
  "1//04eIzv6PqTShGCgYIARAAGAQSNwF-L9Ir0eaxPm7AJaksRGRlnPNdZF7QdJZveHyicF0kEaqhVmQONsbvMOjWychuhXIf2qaPZTw";

const sendOtp = async (req, res) => {
  const { email, userId, name } = req.body;

  try {
    const newOtp = generateOtp(4);
    await User.findOneAndUpdate(
      { _id: userId },
      { $set: { otp: newOtp, email } }
    );
    const { token: accessToken } = await oAuth2Client.getAccessToken();

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: 'eyalokmani@gmail.com',
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        refreshToken: REFRESH_TOKEN,
        accessToken: accessToken,
      },
    });

    const mailOptions = {
      from: 'eyalokmani@gmail.com',
      to: email,
      subject: 'Your OTP for Tradex Pro',
      html: `
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTP Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 20px;
        }
        .container {
            max-width: 600px;
            margin: auto;
            background: #ffffff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 24px;
            color: #333;
        }
        p {
            font-size: 16px;
            color: #555;
        }
        .otp-code {
            font-size: 24px;
            font-weight: bold;
            color: #007BFF;
        }
        .footer {
            margin-top: 20px;
            font-size: 14px;
            color: #777;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Hi ${name ? name : 'User'},</h1>
        <p>Your OTP code is:</p>
        <p class="otp-code">${newOtp}</p>
        <p>Please enter this code to verify your identity.</p>
        <div class="footer">
            <p>Thank you for using our service!</p>
        </div>
    </div>
</body>
</html>
      `,
    };

    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.log('Error sending email:', error);
        return send400(res, { status: false, message: error.message });
      } else {
        console.log('Email sent:', info);
        return send200(res, { status: true, message: MESSAGE.OTP_SENT });
      }
    });
  } catch (error) {
    console.log('Error:', error);
    return send400(res, { status: false, message: error.message });
  }
};


// const sendOtp = async (req, res) => {
//   const { phoneNumber } = req.body;

//   const userId = req.user._id;
//   try {
//     if (!phoneNumber || !validateFields.validatePhoneNumber(phoneNumber)) {
//       return send400(res, {
//         status: false,
//         message: MESSAGE.INVALID_NUMBER,
//       });
//     }

//     const userData = await User.findOne({ phoneNumber });
//     if (userData) {
//       if (
//         userData.phoneNumber === phoneNumber &&
//         userData.isPhoneNumberVerified
//       ) {
//         return send400(res, {
//           status: false,
//           message: MESSAGE.PHONE_EXISTS,
//         });
//       }
//     }
//     const newOtp = generateOtp(4);
//     await User.findOneAndUpdate(
//       { _id: userId },
//       {
//         $set: {
//           otp: newOtp,
//           new: true,
//           phoneNumber,
//         },
//       }
//     );
//     await Fast2SendOtp({
//       message: `Your OTP for Stockology is ${newOtp}`,

//       contactNumber: phoneNumber,
//     });
//     return send200(res, {
//       status: true,
//       message: MESSAGE.OTP_SENT,
//     });
//   } catch (error) {
//     return send400(res, {
//       status: false,
//       message: error.message,
//     });
//   }
// };

const verifyOtp = async (req, res) => {
  const { otp } = req.body;
  const userId = req.user._id;
  try {
    const user = await User.findOne({
      _id: userId,
    });
    if (!user) {
      return send404(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }
    if (!otp) {
      return send400(res, {
        status: false,
        message: MESSAGE.ENTER_OTP,
      });
    }
    if (otp !== user.otp) {
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_OTP,
      });
    }
    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          isProfileComplete: true,
          new: true,
          otp: null,
          joinedOn: new Date(),
          isPhoneNumberVerified: true,
        },
      }
    );
    const data = await User.findOne({ _id: userId });
    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET
    );

    const symbols = [
      "SBIN.NS",
      "RELIANCE.NS",
      "TCS.NS",
      "ICICIBANK.NS",
      "HDFCBANK.NS",
      "BAJFINANCE.NS",
      "SUZLON.NS",
    ];

    const watchlistObjects = symbols.map((symbol) => ({
      symbol,
      userId: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    await watchList.insertMany(watchlistObjects);

    res.header("auth-token", token).status(200).json({
      status: true,
      token: token,
      message: MESSAGE.PHONE_VERIFICATION,
      data,
    });
  } catch (error) {
    return send400(res, {
      status: false,
      message: error.message,
    });
  }
};
const getUserProfile = async (req, res) => {
  const userId = req.user._id;
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return send404(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }
    return send200(res, {
      status: true,
      message: MESSAGE.USER_PROFILE,
      data: user,
    });
  } catch (error) {
    return send400(res, {
      status: false,
      message: error.message,
    });
  }
};
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return send400(res, {
      status: false,
      message: MESSAGE.FIELDS_REQUIRED,
    });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return send404(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }

    const validPass = await hashPassword.compare(password, user.password);

    if (!validPass) {
      return send400(res, {
        status: false,
        message: MESSAGE.LOGIN_ERROR,
      });
    }

    const token = jwt.sign(
      {
        _id: user._id,
      },
      process.env.JWT_SECRET
    );

    res.header("auth-token", token).status(200).json({
      status: true,
      token,
      message: MESSAGE.LOGIN_SUCCESS,
      data: user,
    });
  } catch (error) {
    return send400(res, {
      status: false,
      message: error.message,
    });
  }
};



const getIntro = async (req, res) => {
  try {
    // Fetch introductory information from the database
    const intro = await introModels.findOne({});

    if (!intro) {
      return send404(res, {
        status: false,
        message: MESSAGE.INTRO_NOT_FOUND,
      });
    }

    // Respond with the introductory information
    return send200(res, {
      status: true,
      message: 'Introduction data retrieved successfully',
      data: intro,
    });
  } catch (error) {
    // Handle any errors
    return send400(res, {
      status: false,
      message: MESSAGE.INTERNAL_ERROR,
    });
  }
};



// Deposit Request API
const depositRequest = async (req, res) => {
  const { userId, amount, transactionId, currency, clientUp } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return send404(res, { status: false, message: "User not found" });
    }

    const newDeposit = new userPaymentModels({
      userId,
      type: "DEPOSIT",
      amount,
      transactionId,
      currency,
      clientUp,
    });

    await newDeposit.save();

    return send200(res, { status: true, message: "Deposit request submitted" });
  } catch (error) {
    return send500(res, { status: false, message: error.message });
  }
};

// Withdraw Request API
const withdrawRequest = async (req, res) => {
  const { userId, currency, gateway, amount, upiId } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return send404(res, { status: false, message: "User not found" });
    }

    if (user.wallet < amount) {
      return send400(res, { status: false, message: "Insufficient funds" });
    }

    const newWithdraw = new userPaymentModels({
      userId,
      type: "WITHDRAW",
      amount,
      upiId,
      currency,
      gateway,
    });

    await newWithdraw.save();

    return send200(res, { status: true, message: "Withdrawal request submitted" });
  } catch (error) {
    return send500(res, { status: false, message: error.message });
  }
};
// Admin Accept/Reject Request API
const acceptRequest = async (req, res) => {
  const { action, paymentId } = req.body;

  try {
    const payment = await userPaymentModels.findById(paymentId);
    if (!payment) {
      return send404(res, { status: false, message: "Payment request not found" });
    }

    const user = await User.findById(payment.userId);
    if (!user) {
      return send404(res, { status: false, message: "User not found" });
    }

    user.role = user.role.trim(); // Ensure no extra spaces in role

    if (action === "ACCEPT") {
      if (payment.type === "DEPOSIT") {
        user.wallet += payment.amount;
      } else if (payment.type === "WITHDRAW") {
        user.wallet -= payment.amount;
      }
      payment.status = "ACCEPTED";
      await user.save();
      await payment.save();
      
    } else if (action === "REJECT") {
      // await payment.remove();
      payment.status = "REJECTED";
      // await user.save();
      await payment.save();
    }

    return send200(res, { status: true, message: `Request ${action.toLowerCase()}ed and ${action === "REJECT" ? "removed" : "updated"}` });
  } catch (error) {
    console.error("Error occurred:", error);
    return send500(res, { status: false, message: error.message });
  }
};




// Get Withdrawal and Deposit Lists for Admin
const getPaymentRequests = async (req, res) => {
  try {
    const payments = await userPaymentModels.find().populate('userId', 'fullName email').sort({ createdAt: -1 });

    return send200(res, { status: true, data: payments });
  } catch (error) {
    return send500(res, { status: false, message: error.message });
  }
};

// Add/Update Payment Information API
const addOrUpdatePaymentInfo = async (req, res) => {
  const { QRImage, currency, UPIId } = req.body;

  try {
    let paymentInfo = await paymentInfoModels.findOne(); // We expect only one record

    if (paymentInfo) {
      // Update existing payment information
      paymentInfo.QRImage = QRImage;
      paymentInfo.currency = currency;
      paymentInfo.UPIId = UPIId;
    } else {
      // Create new payment information
      paymentInfo = new paymentInfoModels({ QRImage, currency, UPIId });
    }

    await paymentInfo.save();

    return send200(res, { status: true, message: 'Payment information saved successfully', data: paymentInfo });
  } catch (error) {
    return send500(res, { status: false, message: error.message });
  }
};


// Get Payment Information API
const getPaymentInfo = async (req, res) => {
  try {
    const paymentInfo = await paymentInfoModels.findOne(); // We expect only one record

    if (!paymentInfo) {
      return send404(res, { status: false, message: 'Payment information not found' });
    }

    return send200(res, { status: true, data: paymentInfo });
  } catch (error) {
    return send500(res, { status: false, message: error.message });
  }
};


const userController = {
  register,
  sendOtp,
  verifyOtp,
  getUserProfile,
  login,
  getIntro,
  depositRequest,
  withdrawRequest,
  acceptRequest,
  getPaymentRequests,
  addOrUpdatePaymentInfo,
  getPaymentInfo
};

export default userController;


