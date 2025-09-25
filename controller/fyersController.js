// controllers/fyersController.js
import FyersModel from "fyers-api-v3";
import responseHelper from "../helpers/response.helper.js";
import stockLiveModels from "../models/stockLive.models.js";

const { send200, send400, send500 } = responseHelper;

// Initialize Fyers API with configuration
const fyers = new FyersModel.fyersModel({
  path: "path where you want to save logs",
  enableLogging: true,
});

fyers.setAppId("KRH5CET3E7-100");

// fyers.setRedirectUrl("https://trade.fyers.in/api-login/redirect-uri/index.html");
fyers.setRedirectUrl(
  "https://api-t1.fyers.in/api/v3/generate-authcode?client_id=KRH5CET3E7-100&redirect_uri=https://trade.fyers.in/api-login/redirect-uri/index.html?s=ok&response_type=code&state=sample_state"
  // "https://api-t1.fyers.in/api/v3/generate-authcode?client_id=KRH5CET3E7-100&redirect_uri=https://api-t1.fyers.in/api/v3/generate-authcode?client_id=KRH5CET3E7-100&redirect_uri=https://api-t1.fyers.in/api/v3/generate-authcode?client_id=KRH5CET3E7-100&redirect_uri=https://api-t1.fyers.in/api/v3/generate-authcode?client_id=KRH5CET3E7-100&redirect_uri=https://trade.fyers.in/api-login/redirect-uri/index.html?s=ok?s=ok&code=200&auth_code=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhcGkubG9naW4uZnllcnMuaW4iLCJpYXQiOjE3MjMyMzQ4MDcsImV4cCI6MTcyMzI2NDgwNywibmJmIjoxNzIzMjM0MjA3LCJhdWQiOiJbXCJ4OjBcIiwgXCJ4OjFcIiwgXCJ4OjJcIiwgXCJkOjFcIiwgXCJkOjJcIiwgXCJ4OjFcIiwgXCJ4OjBcIl0iLCJzdWIiOiJhdXRoX2NvZGUiLCJkaXNwbGF5X25hbWUiOiJZTzAwNjQ1Iiwib21zIjoiSzEiLCJoc21fa2V5IjoiM2JiMWY2ZDVlYThlNTcxNjg4MGQ5NjkzOWYxZjNkMmMxZTA2NGFhYWYyNDFlMDQwOGJlZjE4NDgiLCJub25jZSI6IiIsImFwcF9pZCI6Ik9RUEpLTVFCUloiLCJ1dWlkIjoiNDI0YWI3ZTVmODM1NGIyOWJlYTdjZjgyMTJkZGQ1ODUiLCJpcEFkZHIiOiIwLjAuMC4wIiwic2NvcGUiOiIifQ.2nri6FVi_EmoSLyNGAZZgNsv6Id9pRG76JUGbA5g-l0&state=sample_state&response_type=code&state=sample_state&response_type=code&state=sample_state&response_type=code&state=sample_state&response_type=code&state=sample_state"
);

fyers.setAccessToken(
  "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhcGkuZnllcnMuaW4iLCJpYXQiOjE3Mzg5MDk2MDUsImV4cCI6MTczODk3NDY0NSwibmJmIjoxNzM4OTA5NjA1LCJhdWQiOlsieDowIiwieDoxIiwieDoyIiwiZDoxIiwiZDoyIiwieDoxIiwieDowIl0sInN1YiI6ImFjY2Vzc190b2tlbiIsImF0X2hhc2giOiJnQUFBQUFCbnBhZWxFUVk5THhsRUVHYVp3UF9lVkZJRDJoTTRpSl9icUpTaTdiYlRvdjVhOWkwNEM0bWlVeTVRRWJrM3RGNS1JekhtWUtOYTFyaklIMFRFZGdiVDVWX3pIZXZCVUx5eFB0ZXBxYWFabGhMYU9kbz0iLCJkaXNwbGF5X25hbWUiOiJPTVBSQVlBRyBDSE9VQkVZIiwib21zIjoiSzEiLCJoc21fa2V5IjoiM2JiMWY2ZDVlYThlNTcxNjg4MGQ5NjkzOWYxZjNkMmMxZTA2NGFhYWYyNDFlMDQwOGJlZjE4NDgiLCJpc0RkcGlFbmFibGVkIjoiTiIsImlzTXRmRW5hYmxlZCI6Ik4iLCJmeV9pZCI6IllPMDA2NDUiLCJhcHBUeXBlIjoxMDAsInBvYV9mbGFnIjoiTiJ9.HMB2o0Kw24DtpV-E1FOB6ICAiCR0kwoUyUZj16IbgCQ"
);
// Generate authentication code URL
const generateAuthCode = (req, res) => {
  try {
    const URL = fyers.generateAuthCode();
    return send200(res, {
      status: true,
      authUrl: URL,
      message: "Auth code URL generated successfully",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: "Error generating auth code URL",
      details: error.message,
    });
  }
};

// fyers.setAccessToken('eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJhcGkubG9naW4uZnllcnMuaW4iLCJpYXQiOjE3MjI5MjE3NDUsImV4cCI6MTcyMjk1MTc0NSwibmJmIjoxNzIyOTIxMTQ1LCJhdWQiOiJbXCJ4OjBcIiwgXCJ4OjFcIiwgXCJ4OjJcIiwgXCJkOjFcIiwgXCJkOjJcIiwgXCJ4OjFcIiwgXCJ4OjBcIl0iLCJzdWIiOiJhdXRoX2NvZGUiLCJkaXNwbGF5X25hbWUiOiJZTzAwNjQ1Iiwib21zIjoiSzEiLCJoc21fa2V5IjoiM2JiMWY2ZDVlYThlNTcxNjg4MGQ5NjkzOWYxZjNkMmMxZTA2NGFhYWYyNDFlMDQwOGJlZjE4NDgiLCJub25jZSI6IiIsImFwcF9pZCI6Ik9RUEpLTVFCUloiLCJ1dWlkIjoiMjNkNWI1MTBkNzllNGYxNGE4ZTJhYWVhNjJkZWJmM2UiLCJpcEFkZHIiOiIwLjAuMC4wIiwic2NvcGUiOiIifQ.6goPvMGV5cpE3efLy7He5juYW3tV8kCrOkJIan7PzUg')

// Generate access token using auth code
// const generateAccessToken = async (req, res) => {
//     const { authCode } = req.body;

//     console.log("req.body",req.body)
//     if (!authCode) {
//         return send400(res, {
//             status: false,
//             message: "Auth code is required",
//         });
//     }

//     try {
//         const response = await fyers.generate_access_token({
//             client_id: "96KT74LUZO-100",
//             secret_key: "PXDUOGP68H",
//             auth_code: authCode
//         });

//         console.log(response)
//         if (response.s === 'ok') {
//             fyers.setAccessToken(response.access_token);
// console.log(fyers.accessToken); // Debugging to ensure the token is set correctly

//             return send200(res, {
//                 status: true,
//                 accessToken: response.access_token,
//                 message: "Access token generated successfully",
//             });
//         } else {
//             return send400(res, {
//                 status: false,
//                 message: "Error generating access token",
//                 details: response,
//             });
//         }
//     } catch (error) {
//         return send500(res, {
//             status: false,
//             message: "Error generating access token",
//             details: error.message,
//         });
//     }
// };

const generateAccessToken = async (req, res) => {
  const { authCode } = req.body;

  if (!authCode) {
    return send400(res, {
      status: false,
      message: "Auth code is required",
    });
  }

  try {
    const response = await fyers.generate_access_token({
      client_id: "KRH5CET3E7-100",
      secret_key: "PXDUOGP68H",
      auth_code: authCode,
    });

    if (response.s === "ok") {
      fyers.setAccessToken(response.access_token);
      return send200(res, {
        status: true,
        accessToken: response.access_token,
        message: "Access token generated successfully",
      });
    } else {
      return send400(res, {
        status: false,
        message: "Error generating access token",
        details: response,
      });
    }
  } catch (error) {
    return send500(res, {
      status: false,
      message: "Error generating access token",
      details: error.message,
    });
  }
};

const getProfile = async (req, res) => {
  try {
    // Ensure access token is set
    // if (!fyers.accessToken) {
    //     return send400(res, {
    //         status: false,
    //         message: "Access token is missing. Please authenticate first.",
    //     });
    // }

    // Fetch profile
    const response = await fyers.get_profile();

    return send200(res, {
      status: true,
      data: response,
      message: "Profile fetched successfully",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: "Error fetching profile",
      details: error.message,
    });
  }
};

const checkApiLimit = async (req, res) => {
  try {
    // Replace with actual method or API call provided by Fyers
    const response = await fyers.generateUrl();

    return send200(res, {
      status: true,
      data: response,
      message: "API usage limits fetched successfully",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: "Error fetching API usage limits",
      details: error.message,
    });
  }
};

//  const getQuotes = async (req, res) => {
//   const { symbols } = req.body;
//   console.log("symobls reque", req.body);
//   if (!symbols || !Array.isArray(symbols)) {
//     return send400(res, {
//       status: false,
//       message: "Symbols array is required",
//     });
//   }

//   try {
//     const response = await fyers.getQuotes(symbols);
//     console.log("response", response?.d);
//     return send200(res, {
//       status: true,
//       data: response,
//       message: "Quotes fetched successfully",
//     });
//   } catch (error) {
//     return send500(res, {
//       status: false,
//       message: "Error fetching quotes",
//       details: error,
//     });
//   }
// };


// Get quotes for provided symbols
// const getQuotes = async (req, res) => {
//   const { symbols } = req.body;
//   console.log("symobls reque", req.body);
//   if (!symbols || !Array.isArray(symbols)) {
//     return send400(res, {
//       status: false,
//       message: "Symbols array is required",
//     });
//   }

//   try {
//     const response = await fyers.getQuotes(symbols);
//     console.log("response", response?.d);
//     return send200(res, {
//       status: true,
//       data: response,
//       message: "Quotes fetched successfully",
//     });
//   } catch (error) {
//     return send500(res, {
//       status: false,
//       message: "Error fetching quotes",
//       details: error,
//     });
//   }
// };
// const getQuotes = async (req, res) => {
//   const { symbols } = req.body;
//   if (!symbols || !Array.isArray(symbols)) {
//     return send400(res, {
//       status: false,
//       message: "Symbols array is required",
//     });
//   }

//   try {
//     const response = await fyers.getQuotes(symbols);

//     return send200(res, {
//       status: true,
//       data: response,
//       message: "Quotes fetched successfully",
//     });
//   } catch (error) {
//     console.log("Quotdes error:", error);
//     return send500(res, {
//       status: false,
//       message: "Error fetching quotes",
//       details: error?.response?.data || error.message,
//     });
//   }
// };


const getQuotes = async (req, res) => {
  const { symbols } = req.body;
  console.log("symbols requested:", symbols);

  if (!symbols || !Array.isArray(symbols)) {
    return send200(res, {
      status: false,
      message: "Symbols array is required",
      data: null,
    });
  }

  try {
    const response = await fyers.getQuotes(symbols);

    // If response is HTML (indicating a bad response)
    if (typeof response === "string" && response.startsWith("<!DOCTYPE html>")) {
      console.error("Received HTML response instead of JSON");
      return send200(res, {
        status: false,
        message: "Invalid response from Fyers API (HTML content)",
        data: null,
      });
    }

    // If response.d is undefined or empty
    if (!response?.d) {
      console.error("No data in response:", response);
      return send200(res, {
        status: false,
        message: "No data received from Fyers API",
        data: null,
      });
    }

    console.log("Quotes response:", response.d);
    return send200(res, {
      status: true,
      message: "Quotes fetched successfully",
      data: response,
    });
  } catch (error) {
    console.error("getQuotes error:", error.message || error);

    return send200(res, {
      status: false,
      message: "Failed to fetch quotes",
      error: error.message || error,
      data: null,
    });
  }
};


export const getQuotesV2 = async (req, res) => {
  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({
      status: false,
      message: "Symbols array is required.",
    });
  }

  try {
    // Build regex-based query for partial matching
    const regexQueries = symbols.map((sym) => ({
      symbol: { $regex: sym, $options: "i" }, // case-insensitive partial match
    }));

    const data = await stockLiveModels.find({ $or: regexQueries });

    return res.status(200).json({
      status: true,
      data,
      message: "Fetched live quotes using partial symbol match",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch live quotes.",
      error: error.message,
    });
  }
};



// export const getQuotesV2 = async (req, res) => {
//   const { symbols } = req.body;

//   if (!symbols || !Array.isArray(symbols)) {
//     return res.status(400).json({
//       status: false,
//       message: "Symbols array is required.",
//     });
//   }

//   try {
//     const data = await stockLiveModels.find({ symbol: { $in: symbols } });
//     return res.status(200).json({
//       status: true,
//       data,
//       message: "Fetched live quotes from DB",
//     });
//   } catch (error) {
//     return res.status(500).json({
//       status: false,
//       message: "Failed to fetch live quotes.",
//       error: error.message,
//     });
//   }
// };

// Get market depth for provided symbols
const getMarketDepth = async (req, res) => {
  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols)) {
    return send400(res, {
      status: false,
      message: "Symbols array is required",
    });
  }

  try {
    const response = await fyers.getMarketDepth({
      symbol: symbols,
      ohlcv_flag: 1,
    });
    return send200(res, {
      status: true,
      data: response,
      message: "Market depth fetched successfully",
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: "Error fetching market depth",
      details: error.message,
    });
  }
};


// const getBankNiftyOptions = async (req, res) => {
//   try {
//     // Optional query params for flexibility
//     const atm = Number(req.query.atm || 51500);
//     const range = Number(req.query.range || 500);

//     // Download the large Fyers master file
//     const resp = await fetch("https://public.fyers.in/sym_details/NSE_FO_sym_master.json");
//     const buffer = await resp.arrayBuffer();
//     const text = new TextDecoder("utf-8").decode(buffer);
//     const json = JSON.parse(text);

//     const all = Object.values(json);

//     // ✅ Filter BANKNIFTY option contracts
//     const bankniftyOptions = all.filter(
//       (o) => o?.underSym === "BANKNIFTY" && o?.exInstType === 14
//     );
//     if (!bankniftyOptions.length) {
//       return send200(res, {
//         status: true,
//         message: "No BANKNIFTY options found",
//         data: [],
//       });
//     }

//     // Find nearest expiry >= current time
//     const now = Math.floor(Date.now() / 1000);
//     const nearestExpiry = [...new Set(bankniftyOptions.map(o => Number(o.expiryDate)))]
//       .filter(exp => exp >= now)
//       .sort((a, b) => a - b)[0];

//     const currentExpiry = bankniftyOptions.filter(
//       o => Number(o.expiryDate) === nearestExpiry
//     );

//     // Filter around ATM strike
//     const strikes = currentExpiry.filter(
//       o => Math.abs(o.strikePrice - atm) <= range
//     );

//     const symbols = strikes.map(o => o.symTicker);

//     return send200(res, {
//       status: true,
//       message: "BANKNIFTY option symbols fetched successfully",
//       data: symbols,
//     });
//   } catch (error) {
//     console.error("❌ getBankNiftyOptions error:", error.message || error);
//     return send500(res, {
//       status: false,
//       message: "Failed to fetch BANKNIFTY option symbols",
//       details: error.message || error,
//     });
//   }
// };

const getBankNiftyOptions = async (req, res) => {
  try {
    // Optional query params
    const atmBN = Number(req.query.atmBN || 51500); // BANKNIFTY ATM
    const rangeBN = Number(req.query.rangeBN || 500); // BANKNIFTY range
    const atmN = Number(req.query.atmN || 27000); // NIFTY ATM, adjust as needed
    const rangeN = Number(req.query.rangeN || 2000); // NIFTY range to match your screenshots

    // Fetch Fyers master file
    const resp = await fetch("https://public.fyers.in/sym_details/NSE_FO_sym_master.json");
    const buffer = await resp.arrayBuffer();
    const text = new TextDecoder("utf-8").decode(buffer);
    const json = JSON.parse(text);
    const all = Object.values(json);

    const fetchSymbols = (underlying, atm, range) => {
      const options = all.filter(o => o?.underSym === underlying && o?.exInstType === 14);
      if (!options.length) return [];

      const now = Math.floor(Date.now() / 1000);
      const nearestExpiry = [...new Set(options.map(o => Number(o.expiryDate)))]
        .filter(exp => exp >= now)
        .sort((a, b) => a - b)[0];

      const currentExpiry = options.filter(o => Number(o.expiryDate) === nearestExpiry);
      const strikes = currentExpiry.filter(o => Math.abs(o.strikePrice - atm) <= range);

      return strikes.map(o => o.symTicker);
    };

    // Fetch BANKNIFTY and NIFTY with separate ranges
    const bankNiftySymbols = fetchSymbols("BANKNIFTY", atmBN, rangeBN);
    const niftySymbols = fetchSymbols("NIFTY", atmN, rangeN);

    // Combine into single array
    const combinedSymbols = [...bankNiftySymbols, ...niftySymbols];

    return send200(res, {
      status: true,
      message: "Option symbols fetched successfully",
      data: combinedSymbols,
    });

  } catch (error) {
    console.error("❌ getBankNiftyOptions error:", error.message || error);
    return send500(res, {
      status: false,
      message: "Failed to fetch option symbols",
      details: error.message || error,
    });
  }
};




export default {
  generateAuthCode,
  generateAccessToken,
  getProfile,
  getQuotes,
  getMarketDepth,
  checkApiLimit,
  getQuotesV2,
  getBankNiftyOptions
};
