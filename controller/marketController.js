import { Buffer } from "buffer";
import ExcelJS from 'exceljs';
import { dirname } from "path";
import protobuf from "protobufjs";
import { fileURLToPath } from "url";
import { MESSAGE } from "../helpers/message.helper.js";
import responseHelper from "../helpers/response.helper.js";
import isBetween915AMAnd320PM from "../middleware/constants.js";
import commodityModels from "../models/commodity.models.js";
import Stock from "../models/stock.models.js";
import User from "../models/user.models.js";
import watchList from "../models/watchList.models.js";
import WatchlistItem from "../models/WatchlistItem.models.js";
import checkPrice from "../utils/checkPrice.js";
import next5DayDate from "../utils/next5DayDate.js";
import Queues from "../utils/queues.js";
import { fetchOptionChain } from "./nse_lib.js";
import adminModels from "../models/admin.models.js";

const { send200, send201, send403, send400, send401, send404, send500 } =
  responseHelper;



const createWatchlist = async (req, res) => {
  const { name } = req.body;
  const userId = req.user._id;

  console.log("Creating watchlist for user:", userId, "with name:", name);
  try {
    const alreadyExists = await watchList.findOne({ userId, name });
    if (alreadyExists) {
      return send400(res, { status: false, message: "Watchlist name already exists" });
    }

    const newWatchlist = new watchList({ name, userId });
    const data = await newWatchlist.save();

    return send201(res, { status: true, message: "Watchlist created", data });
  } catch (err) {
    return send500(res, { status: false, message: err.message });
  }
};

const deleteWatchlist = async (req, res) => {
  const { id } = req.params;
  const userId = req.user._id;

  try {
    const wl = await watchList.findOneAndDelete({ _id: id, userId });
    if (!wl) {
      return send404(res, { status: false, message: "Watchlist not found" });
    }

    await WatchlistItem.deleteMany({ watchlistId: id });

    return send200(res, { status: true, message: "Watchlist deleted" });
  } catch (err) {
    return send500(res, { status: false, message: err.message });
  }
};

// const getUserWatchlists = async (req, res) => {
//   const userId = req.user._id;

//   try {
//     const lists = await watchList.find({ userId });
//     console.log("check the liiii", lists)

//     const watchlistsWithCount = await Promise.all(
//       lists.map(async (wl) => {
//         const count = await WatchlistItem.countDocuments({ watchlistId: wl._id });
//         return { ...wl._doc, itemCount: count };
//       })
//     );

//     return send200(res, {
//       status: true,
//       message: "User watchlists fetched",
//       data: watchlistsWithCount,
//     });
//   } catch (err) {
//     return send500(res, { status: false, message: err.message });
//   }
// };

const getUserWatchlists = async (req, res) => {
  const userId = req.user._id;

  try {
    // Get all non-empty watchlists for the user
    const lists = await watchList.find({
      userId,
      name: { $nin: [null, ""] }, // Exclude null and empty names
    });

    // Count items in each watchlist
    const watchlistsWithCount = await Promise.all(
      lists.map(async (wl) => {
        const count = await WatchlistItem.countDocuments({ watchlistId: wl._id });
        return {
          ...wl.toObject(),
          itemCount: count,
        };
      })
    );

    return send200(res, {
      status: true,
      message: "User watchlists fetched successfully",
      data: watchlistsWithCount,
    });
  } catch (err) {
    return send500(res, {
      status: false,
      message: err.message || "Failed to fetch watchlists",
    });
  }
};

const addSymbolToWatchlist = async (req, res) => {
  const { watchlistId, symbol } = req.body;
  console.log("Adding symbol to watchlist:", watchlistId, symbol);
  try {
    const exists = await WatchlistItem.findOne({ watchlistId, symbol });
    if (exists) {
      return send400(res, { status: false, message: "Symbol already exists in watchlist" });
    }

    const item = new WatchlistItem({ watchlistId, symbol });
    const saved = await item.save();

    return send201(res, { status: true, message: "Symbol added", data: saved });
  } catch (err) {
    console.log("Error adding symbol to watchlist:", err);
    return send500(res, { status: false, message: err.message });
  }
};

const removeSymbolFromWatchlist = async (req, res) => {
  const { watchlistId, symbol } = req.params;

  try {
    const deleted = await WatchlistItem.findOneAndDelete({ watchlistId, symbol });
    if (!deleted) {
      return send404(res, { status: false, message: "Symbol not found in watchlist" });
    }

    return send200(res, { status: true, message: "Symbol removed from watchlist" });
  } catch (err) {
    return send500(res, { status: false, message: err.message });
  }
};

const getSymbolsInWatchlist = async (req, res) => {
  const { watchlistId } = req.params;

  try {
    const items = await WatchlistItem.find({ watchlistId });

    return send200(res, {
      status: true,
      message: "Watchlist symbols fetched",
      data: items,
    });
  } catch (err) {
    return send500(res, { status: false, message: err.message });
  }
};

const getAllSymbolsByUser = async (req, res) => {
  console.log("Fetching all symbols for user:", req.user._id);
  const userId = req.user._id;

  try {
    // Step 1: Get all watchlists of the user
    const watchlists = await watchList.find({ userId });

    if (!watchlists.length) {
      return res.status(404).json({ status: false, message: "No watchlists found" });
    }

    const watchlistIds = watchlists.map(wl => wl._id);

    // Step 2: Get all watchlist items for those watchlistIds
    const items = await WatchlistItem.find({ watchlistId: { $in: watchlistIds } });

    // Step 3: Group symbols under each watchlist
    const groupedResult = watchlists.map(wl => ({
      watchlistId: wl._id,
      watchlistName: wl.name,
      symbols: items
        .filter(item => item.watchlistId.toString() === wl._id.toString())
        .map(item => item.symbol),
    }));

    return res.status(200).json({ status: true, data: groupedResult });
  } catch (err) {
    console.error("Error fetching symbols by user:", err);
    return res.status(500).json({ status: false, message: "Server error" });
  }
};

const addToWatchList = async (req, res) => {
  const { symbol } = req.body;
  const userId = req.user._id;

  try {
    if (!symbol) {
      return send400(res, {
        status: false,
        message: MESSAGE.SYMBOL_EMPTY,
      });
    }
    const alreadyAdded = await watchList.findOne({ userId, symbol });
    if (alreadyAdded) {
      return send400(res, {
        status: false,
        message: MESSAGE.SYMBOL_ALREADY_EXISTS,
      });
    }
    const addWatchList = new watchList({
      symbol,
      userId,
    });
    const data = await addWatchList.save();
    return send201(res, {
      status: true,
      message: MESSAGE.SYMBOL_ADDED,
      data,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

const getWatchList = async (req, res) => {
  const userId = req?.user?._id;
  const page = req?.params?.page;
  const itemsPerPage = 10;

  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return send404(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }

    if (page) {
      const skip = (page - 1) * itemsPerPage;
      const limit = itemsPerPage;

      const watchListData = await watchList
        .find({ userId })
        .skip(skip)
        .limit(limit);

      return send200(res, {
        status: true,
        message: MESSAGE.WATCH_LIST_DATA,
        data: watchListData || [],
      });
    } else {
      const watchListData = await watchList.find({ userId });
      return send200(res, {
        status: true,
        message: MESSAGE.WATCH_LIST_DATA,
        data: watchListData || [],
      });
    }
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};




const removeWatchListItem = async (req, res) => {
  const userId = req.user._id;
  const symbol = req.params.symbol;
  try {
    const watchListData = await watchList.findOne({ userId, symbol });
    if (!watchListData) {
      return send400(res, {
        status: false,
        message: MESSAGE.SYMBOL_NOT_FOUND,
      });
    }
    await watchList.findOneAndDelete({ userId, symbol });
    return send200(res, {
      status: true,
      message: MESSAGE.SYMBOL_REMOVED,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

const buy = async (req, res) => {
  const {
    stockName,
    symbol,
    totalAmount,
    stockType,
    type,
    quantity,
    stockPrice,
    stopLoss,
    expiryDate,
    optionType,
    identifier,
  } = req.body;
  const userId = req.user._id;
  console.log("check me tock", req.body)
  try {
    if (
      !stockName ||
      !symbol ||
      !totalAmount ||
      !stockType ||
      !type ||
      !quantity ||
      !stockPrice
    ) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }
    if (stockType === "SL" && !stopLoss) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    const isValidTime = isBetween915AMAnd320PM();
    const userData = await User.findOne({ _id: userId });
    if (totalAmount > userData.wallet) {
      return send400(res, {
        status: false,
        message: MESSAGE.INSUFFICIENT_FUNDS,
      });
    }
    if (type === "INTRADAY") {
      if (!isValidTime) {
        return send400(res, {
          status: false,
          message: MESSAGE.ITRADAY_ERROR,
        });
      }
      if (stockType === "MKT") {
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          buyDate: new Date(),
          status: "BUY",
          executed: true,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        // Fetch the user
        const userData = await User.findById(userId);
        if (!userData) {
          return send404(res, { status: false, message: "User not found" });
        }

        // Initialize commission
        let commissionAmount = 0;

        // Try to find the broker admin using brokerCode
        let brokerAdmin = null;
        if (userData.brokerCode) {
          brokerAdmin = await adminModels.findOne({ brokerCode: userData?.brokerCode });
        }

        // If no broker admin found, fallback to super admin (createdBy == null or SUPER_ADMIN role)
        if (!brokerAdmin) {
          brokerAdmin = await adminModels.findOne({ role: "SUPER_ADMIN" });
        }

        // Calculate commission if brokerAdmin has commissionRate
        if (brokerAdmin?.commision) {
          const commissionRate = brokerAdmin?.commision; // in %
          commissionAmount = Number(commissionRate)
        }


        // Deduct from wallet
        const newWallet = userData?.wallet - totalAmount - commissionAmount;
        const newInvested = userData?.totalInvested + totalAmount;
        console.log("The commmmm 1", commissionAmount, userData?.wallet, totalAmount)

        await User.findByIdAndUpdate(userId, {
          $set: {
            wallet: newWallet,
            totalInvested: newInvested,
          },
        });


        // await User.findOneAndUpdate(
        //   { _id: userId },
        //   {
        //     $set: {
        //       wallet: userData.wallet - totalAmount,
        //       totalInvested: userData.totalInvested + totalAmount,
        //     },
        //   }
        // );
        const checkData = { symbol, id: data._id, userId };
        Queues.intradayMKT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "LMT") {
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          buyDate: new Date(),
          status: "BUY",
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        // Fetch the user
        const userData = await User.findById(userId);
        if (!userData) {
          return send404(res, { status: false, message: "User not found" });
        }

        // Initialize commission
        let commissionAmount = 0;

        // Try to find the broker admin using brokerCode
        let brokerAdmin = null;
        if (userData.brokerCode) {
          brokerAdmin = await adminModels.findOne({ brokerCode: userData?.brokerCode });
        }

        // If no broker admin found, fallback to super admin (createdBy == null or SUPER_ADMIN role)
        if (!brokerAdmin) {
          brokerAdmin = await adminModels.findOne({ role: "SUPER_ADMIN" });
        }

        // Calculate commission if brokerAdmin has commissionRate
        if (brokerAdmin?.commision) {
          const commissionRate = brokerAdmin?.commision; // in %
          commissionAmount = Number(commissionRate)
        }

        // Deduct from wallet
        const newWallet = userData?.wallet - totalAmount - commissionAmount;
        const newInvested = userData?.totalInvested + totalAmount;
        console.log("The commmmm 2", commissionAmount, userData?.wallet, totalAmount)

        await User.findByIdAndUpdate(userId, {
          $set: {
            wallet: newWallet,
            totalInvested: newInvested,
          },
        });

        // await User.findOneAndUpdate(
        //   { _id: userId },
        //   {
        //     $set: {
        //       wallet: userData.wallet - totalAmount,
        //       totalInvested: userData.totalInvested + totalAmount,
        //     },
        //   }
        // );
        const checkData = { symbol, id: data._id, userId };
        Queues.intradayLMT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "SL") {
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          buyDate: new Date(),
          status: "BUY",
          stopLoss,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        // Fetch the user
        const userData = await User.findById(userId);
        if (!userData) {
          return send404(res, { status: false, message: "User not found" });
        }

        // Initialize commission
        let commissionAmount = 0;

        // Try to find the broker admin using brokerCode
        let brokerAdmin = null;
        if (userData.brokerCode) {
          brokerAdmin = await adminModels.findOne({ brokerCode: userData?.brokerCode });
        }

        // If no broker admin found, fallback to super admin (createdBy == null or SUPER_ADMIN role)
        if (!brokerAdmin) {
          brokerAdmin = await adminModels.findOne({ role: "SUPER_ADMIN" });
        }

        // Calculate commission if brokerAdmin has commissionRate
        if (brokerAdmin?.commision) {
          const commissionRate = brokerAdmin?.commision; // in %
          commissionAmount = Number(commissionRate)
        }

        // Deduct from wallet
        const newWallet = userData?.wallet - totalAmount - commissionAmount;
        const newInvested = userData?.totalInvested + totalAmount;
        console.log("The commmmm 3", commissionAmount, userData?.wallet, totalAmount)

        await User.findByIdAndUpdate(userId, {
          $set: {
            wallet: newWallet,
            totalInvested: newInvested,
          },
        });

        // await User.findOneAndUpdate(
        //   { _id: userId },
        //   {
        //     $set: {
        //       wallet: userData.wallet - totalAmount,
        //       totalInvested: userData.totalInvested + totalAmount,
        //     },
        //   }
        // );
        const checkData = { symbol, id: data._id, userId, stopLoss };
        Queues.intradaySL(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      } else {
        return send400(res, {
          status: true,
          message: MESSAGE.INVALID_STOCK_TYPE,
        });
      }
    } else {
      if (stockType === "MKT") {
        const nextDate = next5DayDate(new Date());
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          buyDate: new Date(),
          status: "BUY",
          executed: true,
          toSquareOffOn: nextDate,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        // Fetch the user
        const userData = await User.findById(userId);
        if (!userData) {
          return send404(res, { status: false, message: "User not found" });
        }

        // Initialize commission
        let commissionAmount = 0;

        // Try to find the broker admin using brokerCode
        let brokerAdmin = null;
        if (userData.brokerCode) {
          brokerAdmin = await adminModels.findOne({ brokerCode: userData?.brokerCode });
        }

        // If no broker admin found, fallback to super admin (createdBy == null or SUPER_ADMIN role)
        if (!brokerAdmin) {
          brokerAdmin = await adminModels.findOne({ role: "SUPER_ADMIN" });
        }

        // Calculate commission if brokerAdmin has commissionRate
        if (brokerAdmin?.commision) {
          const commissionRate = brokerAdmin?.commision; // in %
          commissionAmount = Number(commissionRate)
        }

        // Deduct from wallet
        const newWallet = userData?.wallet - totalAmount - commissionAmount;
        const newInvested = userData?.totalInvested + totalAmount;

        console.log("The commmmm 4", commissionAmount, userData?.wallet, totalAmount)

        await User.findByIdAndUpdate(userId, {
          $set: {
            wallet: newWallet,
            totalInvested: newInvested,
          },
        });

        // await User.findOneAndUpdate(
        //   { _id: userId },
        //   {
        //     $set: {
        //       wallet: userData.wallet - totalAmount,
        //       totalInvested: userData.totalInvested + totalAmount,
        //     },
        //   }
        // );
        const checkData = { symbol, id: data._id, userId };
        Queues.deliveryMKT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "LMT") {
        const nextDate = next5DayDate(new Date());
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          buyDate: new Date(),
          status: "BUY",
          toSquareOffOn: nextDate,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        // Fetch the user
        const userData = await User.findById(userId);
        if (!userData) {
          return send404(res, { status: false, message: "User not found" });
        }

        // Initialize commission
        let commissionAmount = 0;

        // Try to find the broker admin using brokerCode
        let brokerAdmin = null;
        if (userData.brokerCode) {
          brokerAdmin = await adminModels.findOne({ brokerCode: userData?.brokerCode });
        }

        // If no broker admin found, fallback to super admin (createdBy == null or SUPER_ADMIN role)
        if (!brokerAdmin) {
          brokerAdmin = await adminModels.findOne({ role: "SUPER_ADMIN" });
        }

        // Calculate commission if brokerAdmin has commissionRate
        if (brokerAdmin?.commision) {
          const commissionRate = brokerAdmin?.commision; // in %
          commissionAmount = Number(commissionRate)
        }

        // Deduct from wallet
        const newWallet = userData?.wallet - totalAmount - commissionAmount;
        const newInvested = userData?.totalInvested + totalAmount;

        console.log("The commmmm 5", commissionAmount, userData?.wallet, totalAmount)

        await User.findByIdAndUpdate(userId, {
          $set: {
            wallet: newWallet,
            totalInvested: newInvested,
          },
        });

        // await User.findOneAndUpdate(
        //   { _id: userId },
        //   {
        //     $set: {
        //       wallet: userData.wallet - totalAmount,
        //       totalInvested: userData.totalInvested + totalAmount,
        //     },
        //   }
        // );
        const checkData = { symbol, id: data._id, userId };
        Queues.deliveryLMT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "SL") {
        const nextDate = next5DayDate(new Date());
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          buyDate: new Date(),
          status: "BUY",
          stopLoss,
          toSquareOffOn: nextDate,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        // Fetch the user
        const userData = await User.findById(userId);
        if (!userData) {
          return send404(res, { status: false, message: "User not found" });
        }

        // Initialize commission
        let commissionAmount = 0;

        // Try to find the broker admin using brokerCode
        let brokerAdmin = null;
        if (userData.brokerCode) {
          brokerAdmin = await adminModels.findOne({ brokerCode: userData?.brokerCode });
        }

        // If no broker admin found, fallback to super admin (createdBy == null or SUPER_ADMIN role)
        if (!brokerAdmin) {
          brokerAdmin = await adminModels.findOne({ role: "SUPER_ADMIN" });
        }

        // Calculate commission if brokerAdmin has commissionRate
        if (brokerAdmin?.commision) {
          const commissionRate = brokerAdmin?.commision; // in %
          commissionAmount = Number(commissionRate)
        }

        // Deduct from wallet
        const newWallet = userData?.wallet - totalAmount - commissionAmount;
        const newInvested = userData?.totalInvested + totalAmount;

        console.log("The commmmm 6", commissionAmount, userData?.wallet, totalAmount)
        await User.findByIdAndUpdate(userId, {
          $set: {
            wallet: newWallet,
            totalInvested: newInvested,
          },
        });

        // await User.findOneAndUpdate(
        //   { _id: userId },
        //   {
        //     $set: {
        //       wallet: userData.wallet - totalAmount,
        //       totalInvested: userData.totalInvested + totalAmount,
        //     },
        //   }
        // );
        const checkData = { symbol, id: data._id, userId, stopLoss };
        Queues.deliverySL(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      } else {
        return send400(res, {
          status: true,
          message: MESSAGE.INVALID_TYPE,
        });
      }
    }
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};
const sell = async (req, res) => {
  const {
    stockName,
    symbol,
    totalAmount,
    stockType,
    type,
    quantity,
    stockPrice,
    stopLoss,
    expiryDate,
    optionType,
    identifier,
  } = req.body;
  const userId = req.user._id;
  try {
    if (
      !stockName ||
      !symbol ||
      !totalAmount ||
      !stockType ||
      !type ||
      !quantity ||
      !stockPrice
    ) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }
    if (stockType === "SL" && !stopLoss) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }
    if (type !== "INTRADAY") {
      return send400(res, {
        status: false,
        message: MESSAGE.SELL_ERROR,
      });
    }

    const isValidTime = isBetween915AMAnd320PM();
    const userData = await User.findOne({ _id: userId });
    if (totalAmount > userData.wallet) {
      return send400(res, {
        status: false,
        message: MESSAGE.INSUFFICIENT_FUNDS,
      });
    }
    if (type === "INTRADAY") {
      if (!isValidTime) {
        return send400(res, {
          status: false,
          message: MESSAGE.ITRADAY_ERROR,
        });
      }
      if (stockType === "MKT") {
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          soldDate: new Date(),
          status: "SELL",
          executed: true,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: {
              wallet: userData.wallet - totalAmount,
              totalInvested: userData.totalInvested + totalAmount,
            },
          }
        );
        const checkData = { symbol, id: data._id, userId };
        Queues.intradayMKT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "LMT") {
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          soldDate: new Date(),
          status: "SELL",
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: {
              wallet: userData.wallet - totalAmount,
              totalInvested: userData.totalInvested + totalAmount,
            },
          }
        );
        const checkData = { symbol, id: data._id, userId };
        Queues.intradayLMT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "SL") {
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          soldDate: new Date(),
          status: "SELL",
          stopLoss,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: {
              wallet: userData.wallet - totalAmount,
              totalInvested: userData.totalInvested + totalAmount,
            },
          }
        );
        const checkData = { symbol, id: data._id, userId, stopLoss };
        Queues.intradaySL(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      } else {
        return send400(res, {
          status: true,
          message: MESSAGE.INVALID_STOCK_TYPE,
        });
      }
    } else {
      if (stockType === "MKT") {
        const nextDate = next5DayDate(new Date());
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          soldDate: new Date(),
          status: "SELL",
          executed: true,
          toSquareOffOn: nextDate,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: {
              wallet: userData.wallet - totalAmount,
              totalInvested: userData.totalInvested + totalAmount,
            },
          }
        );
        const checkData = { symbol, id: data._id, userId };
        Queues.deliveryMKT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "LMT") {
        const nextDate = next5DayDate(new Date());
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          soldDate: new Date(),
          status: "SELL",
          toSquareOffOn: nextDate,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: {
              wallet: userData.wallet - totalAmount,
              totalInvested: userData.totalInvested + totalAmount,
            },
          }
        );
        const checkData = { symbol, id: data._id, userId };
        Queues.deliveryLMT(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      }
      if (stockType === "SL") {
        const nextDate = next5DayDate(new Date());
        const newStock = new Stock({
          stockName,
          symbol,
          totalAmount,
          stockType,
          type,
          quantity,
          userId,
          stockPrice,
          soldDate: new Date(),
          status: "SELL",
          stopLoss,
          toSquareOffOn: nextDate,
          expiryDate,
          optionType,
          identifier,
        });
        const data = await newStock.save();
        await User.findOneAndUpdate(
          { _id: userId },
          {
            $set: {
              wallet: userData.wallet - totalAmount,
              totalInvested: userData.totalInvested + totalAmount,
            },
          }
        );
        const checkData = { symbol, id: data._id, userId, stopLoss };
        Queues.deliverySL(checkData);
        return send200(res, {
          status: true,
          message: MESSAGE.ADDED_IN_QUEUE,
          data,
        });
      } else {
        return send400(res, {
          status: true,
          message: MESSAGE.INVALID_TYPE,
        });
      }
    }
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};
const buyCommodity = async (req, res) => {
  const {
    commodityName,
    symbol,
    totalAmount,
    orderType,
    tradeType,
    quantity,
    commodityPrice,
    stopLoss,
  } = req.body;

  const userId = req.user._id;

  try {
    console.log("Received buy request:", req.body);

    // Validate required fields
    if (
      !commodityName ||
      !symbol ||
      !totalAmount ||
      !orderType ||
      !tradeType ||
      !quantity ||
      !commodityPrice
    ) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    // Validate stopLoss field for SL orders
    if (orderType === "SL" && stopLoss === undefined) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    // Check valid trading hours
    const isValidTime = isBetween915AMAnd320PM();
    const userData = await User.findById(userId);

    if (!userData) {
      return send400(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }

    if (totalAmount > userData.wallet) {
      return send400(res, {
        status: false,
        message: MESSAGE.INSUFFICIENT_FUNDS,
      });
    }

    // Prepare common data for the commodity
    const commonData = {
      commodityName,
      symbol,
      totalAmount,
      orderType,
      tradeType,
      quantity,
      userId,
      commodityPrice,
      buyDate: new Date(),
      status: "BUY",
      stopLoss: orderType === "SL" ? stopLoss : undefined,
    };

    console.log("Common Data for new commodity:", commonData);

    let newCommodity;
    let queueFunction;
    let nextDate;

    // Handling Intraday trades
    if (tradeType === "INTRADAY") {
      if (!isValidTime) {
        return send400(res, {
          status: false,
          message: MESSAGE.INTRADAY_ERROR,
        });
      }

      if (orderType === "MKT" || orderType === "LMT") {
        newCommodity = new commodityModels({
          ...commonData,
          executed: orderType === "MKT",
        });
        queueFunction = orderType === "MKT" ? Queues.intradayMKT : Queues.intradayLMT;
      } else if (orderType === "SL") {
        newCommodity = new commodityModels(commonData);
        queueFunction = Queues.intradaySL;
      } else {
        return send400(res, {
          status: false,
          message: MESSAGE.INVALID_ORDER_TYPE,
        });
      }
    } else {
      // Handling Delivery trades
      nextDate = next5DayDate(new Date());

      if (orderType === "MKT" || orderType === "LMT") {
        newCommodity = new commodityModels({
          ...commonData,
          executed: orderType === "MKT",
          toSquareOffOn: nextDate,
        });
        queueFunction = orderType === "MKT" ? Queues.deliveryMKT : Queues.deliveryLMT;
      } else if (orderType === "SL") {
        newCommodity = new commodityModels({
          ...commonData,
          toSquareOffOn: nextDate,
        });
        queueFunction = Queues.deliverySL;
      } else {
        return send400(res, {
          status: false,
          message: MESSAGE.INVALID_ORDER_TYPE,
        });
      }
    }

    // Save commodity and update user wallet
    const data = await newCommodity.save();
    await User.findByIdAndUpdate(userId, {
      $set: {
        wallet: userData.wallet - totalAmount,
        totalInvested: userData.totalInvested + totalAmount,
      },
    });

    console.log("Commodity saved and user updated:", data);

    // Process the queue
    if (queueFunction) {
      queueFunction({ symbol, id: data._id, userId, stopLoss });
    } else {
      console.error("Queue function is not defined.");
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_QUEUE_FUNCTION,
      });
    }

    return send200(res, {
      status: true,
      message: MESSAGE.ADDED_IN_QUEUE,
      data,
    });
  } catch (error) {
    console.error("Error in buyCommodity:", error.message);
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};





const sellCommodity = async (req, res) => {
  const {
    commodityName,
    symbol,
    totalAmount,
    orderType,
    tradeType,
    quantity,
    commodityPrice,
    stopLoss,
  } = req.body;

  const userId = req.user._id;

  try {
    // Validate required fields
    if (
      !commodityName ||
      !symbol ||
      !totalAmount ||
      !orderType ||
      !tradeType ||
      !quantity ||
      !commodityPrice
    ) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    // Validate stopLoss field for SL orders
    if (orderType === "SL" && stopLoss === undefined) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    // Check valid trading hours - adjust this as per your trading rules
    // const isValidTime = isBetween915AMAnd320PM();
    const userData = await User.findById(userId);

    if (!userData) {
      return send400(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }

    // Assuming selling involves adjusting wallet balance
    if (totalAmount > userData.wallet) {
      return send400(res, {
        status: false,
        message: MESSAGE.INSUFFICIENT_FUNDS,
      });
    }

    // Prepare common data for the commodity
    const commonData = {
      commodityName,
      symbol,
      totalAmount,
      orderType,
      tradeType,
      quantity,
      userId,
      commodityPrice,
      soldDate: new Date(),
      status: "SELL",
      stopLoss: orderType === "SL" ? stopLoss : undefined,
    };

    // Create and save the commodity
    let newCommodity;
    let queueFunction;

    // Generalize queue handling based on orderType
    if (orderType === "MKT" || orderType === "LMT") {
      newCommodity = new commodityModels({
        ...commonData,
        executed: orderType === "MKT",
      });
      queueFunction = orderType === "MKT" ? Queues.generalMKT : Queues.generalLMT;
    } else if (orderType === "SL") {
      newCommodity = new commodityModels(commonData);
      queueFunction = Queues.generalSL;
    } else {
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_ORDER_TYPE,
      });
    }

    // Save the commodity and update user wallet
    const data = await newCommodity.save();
    await User.findByIdAndUpdate(userId, {
      $set: {
        wallet: userData.wallet + totalAmount, // Adjust wallet balance for selling
        totalInvested: userData.totalInvested - totalAmount,
      },
    });

    // Process the queue
    queueFunction({ symbol, id: data._id, userId, stopLoss });

    return send200(res, {
      status: true,
      message: MESSAGE.ADDED_IN_QUEUE,
      data,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};




const squareOff = async (req, res) => {

  const { stockId, stockName, identifier, optionType, latestPriceData } = req.body;
  const userId = req.user._id;

  console.log("reqreqreqreqreq so", req.body, latestPriceData);
  // reqreqreqreqreq so {
  //   stockId: '6735c6f0a075adcfd14e1811',
  //   totalAmount: 3251.8500000000004,
  //   stockPrice: 1083.95,
  //   stockName: 'NIFTY'
  // }


  try {
    // Validate request fields
    if (!stockId) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }

    // Check if the current time is valid for intraday stocks
    const isValidTime = isBetween915AMAnd320PM();

    // Fetch stock data
    const stockData = await Stock.findOne({ _id: stockId });
    if (!stockData) {
      return send400(res, {
        status: false,
        message: MESSAGE.STOCK_NOT_FOUND,
      });
    }

    // Check if the stock has already been squared off
    if (stockData.squareOff) {
      return send400(res, {
        status: false,
        message: MESSAGE.ALREADY_SQUARED,
      });
    }

    // Check if the stock has been executed
    if (!stockData.executed) {
      return send400(res, {
        status: false,
        message: MESSAGE.NOT_EXECUTED,
      });
    }

    // Validate time for intraday stocks
    if (stockData.type === "INTRADAY" && !isValidTime) {
      return send400(res, {
        status: false,
        message: MESSAGE.OUT_OF_TIME_SQUARE,
      });
    }

    // Check if the stock is invalid or failed
    if (stockData.failed) {
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_STOCK,
      });
    }

    // Fetch user data
    const userData = await User.findOne({ _id: userId });
    if (!userData) {
      return send400(res, {
        status: false,
        message: MESSAGE.USER_NOT_FOUND,
      });
    }

    // console.log("reqreqreqreqreq so out", stockName, stockData, stockData?.identifier, stockData?.optionType)
    // Get the latest price for the stock\
    let latestPrice;
    if (stockData?.identifier != '') {
      // console.log("reqreqreqreqreq so", stockName, stockData)
      latestPrice = latestPriceData;
      // latestPrice = await checkPriceStockName(stockData?.symbol, stockData?.optionType, stockData?.identifier);
      if (isNaN(latestPrice)) {
        return send400(res, {
          status: false,
          message: `Not found ${stockData?.identifier}`,
        });
      }
    } else {
      latestPrice = await checkPrice(stockData.symbol);
      if (isNaN(latestPrice)) {
        return send400(res, {
          status: false,
          message: `Not found ${stockData?.identifier}`,
        });
      }
    }


    // Calculate new price and profit/loss
    const newPrice = latestPrice * stockData?.quantity;
    const PL = newPrice - stockData.totalAmount;

    // Update stock data
    await Stock.findOneAndUpdate(
      { _id: stockId },
      {
        $set: {
          stockPrice: latestPrice,
          netProfitAndLoss: PL,
          squareOff: true,
          totalAmount: newPrice,
          squareOffDate: new Date(),
        },
      }
    );

    // Update user data
    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          wallet: userData.wallet + newPrice,
          overallProfit: userData.overallProfit + PL,
        },
      }
    );

    return send200(res, {
      status: true,
      message: MESSAGE.STOCK_SQUARE_OFF,
    });
  } catch (error) {
    console.error("Error during square-off:", error);
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};


const getNSELatestPrice = async (req, res) => {
  const { stockId } = req.body; // Use query parameters

  try {
    // Validate request parameters

    const stockData = await Stock.findOne({ _id: stockId });
    if (!stockData) {
      return send400(res, {
        status: false,
        message: MESSAGE.STOCK_NOT_FOUND,
      });
    }


    let latestPrice;
    // Fetch the latest price
    if (stockData?.identifier != '') {
      latestPrice = latestPriceData;
      // latestPrice = await checkPriceStockName(stockData?.symbol, stockData?.optionType, stockData?.identifier);
    } else {
      latestPrice = await checkPrice(stockData.symbol);
    }

    if (isNaN(latestPrice)) {
      return res.status(404).json({
        status: false,
        message: `Price not found for identifier ${identifier}`,
      });
    }

    // Respond with the latest price
    return res.status(200).json({
      status: true,
      latestPrice,
    });
  } catch (error) {
    console.error("Error fetching NSE latest price:", error);
    return res.status(500).json({
      status: false,
      message: 'Internal Server Error',
    });
  }
};



const squareOffCommodity = async (req, res) => {
  const { stockId, totalAmount, stockPrice, latestPrice } = req.body;
  const userId = req.user._id;

  try {
    if (!stockId || isNaN(totalAmount) || isNaN(stockPrice)) {
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_INPUT_DATA,
      });
    }

    const commodityData = await commodityModels.findOne({ _id: stockId });

    if (!commodityData) {
      return send400(res, {
        status: false,
        message: MESSAGE.COMMODITY_NOT_FOUND,
      });
    }

    if (commodityData.squareOff) {
      return send400(res, {
        status: false,
        message: MESSAGE.ALREADY_SQUARED,
      });
    }

    if (!commodityData.executed) {
      return send400(res, {
        status: false,
        message: MESSAGE.NOT_EXECUTED,
      });
    }

    if (commodityData.type === "INTRADAY" && !isBetween915AMAnd320PM()) {
      return send400(res, {
        status: false,
        message: MESSAGE.OUT_OF_TIME_SQUARE,
      });
    }

    if (commodityData.failed) {
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_COMMODITY,
      });
    }

    const userData = await User.findOne({ _id: userId });

    const newPrice = latestPrice * commodityData.quantity;
    const PL = newPrice - stockPrice;


    await commodityModels.findOneAndUpdate(
      { _id: stockId },
      {
        $set: {
          commodityPrice: stockPrice,
          netProfitAndLoss: PL,
          squareOff: true,
          totalAmount: newPrice,
          squareOffDate: new Date(),
        },
      }
    );

    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          wallet: userData.wallet + newPrice,
          overallProfit: userData.overallProfit + PL,
        },
      }
    );

    return send200(res, {
      status: true,
      message: MESSAGE.STOCK_SQUARE_OFF,
    });
  } catch (error) {
    console.error("Error during square-off:", error);
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};





const getMyStocks = async (req, res) => {
  const userId = req.user._id;
  const type = req.params.type;

  try {
    const StocksData = await Stock.find({ userId });
    let data = [];
    data = StocksData;
    if (type === "pending") {
      data = StocksData.filter((stock) => !stock.executed && !stock.squareOff);
    }
    if (type === "executed" || type === "trades") {
      data = StocksData.filter((stock) => stock.executed && !stock.squareOff);
    }
    if (type === "others") {
      data = StocksData.filter((stock) => stock.failed && !stock.squareOff);
    }
    return send200(res, {
      status: true,
      message: MESSAGE.USER_STOCK_DATA,
      data,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

const getMyCommodities = async (req, res) => {
  const userId = req.user._id;
  const type = req.params.type;

  try {
    const commoditiesData = await commodityModels.find({ userId }); // Assume Commodity is the model for commodities
    let data = [];
    data = commoditiesData;
    if (type === "pending") {
      data = commoditiesData.filter((commodity) => !commodity.executed && !commodity.squareOff);
    }
    if (type === "executed" || type === "trades") {
      data = commoditiesData.filter((commodity) => commodity.executed && !commodity.squareOff);
    }
    if (type === "others") {
      data = commoditiesData.filter((commodity) => commodity.failed && !commodity.squareOff);
    }
    return send200(res, {
      status: true,
      message: MESSAGE.USER_COMMODITY_DATA,
      data,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};


const getMyStockHistory = async (req, res) => {
  const userId = req.user._id;

  try {
    const data = await Stock.find({ userId, squareOff: true });
    return send200(res, {
      status: true,
      message: MESSAGE.USER_STOCK_DATA,
      data,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};
const decodeStockData = async (req, res) => {
  const stockData = req.body.stockData;

  try {
    const currentModuleURL = import.meta.url;
    const currentModulePath = fileURLToPath(currentModuleURL);
    const root = protobuf.loadSync(
      dirname(currentModulePath) + "/YPricingData.proto"
    );
    const Yaticker = root.lookupType("yaticker");
    const data = Yaticker.decode(new Buffer(stockData, "base64"));
    return send200(res, {
      status: true,
      message: MESSAGE.DECODED_DATA,
      data,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

const deleteStock = async (req, res) => {
  const userId = req.user._id;
  const itemId = req.params.id;
  try {
    if (!itemId) {
      return send400(res, {
        status: false,
        message: MESSAGE.FIELDS_REQUIRED,
      });
    }
    const userData = await User.findOne({ _id: userId });
    const StockData = await Stock.findOne({ userId, _id: itemId });
    if (!StockData) {
      return send400(res, {
        status: false,
        message: MESSAGE.STOCK_NOT_FOUND,
      });
    }
    if (Stock.executed || Stock.squareOff) {
      return send400(res, {
        status: false,
        message: MESSAGE.INVALID_STOCK_STATUS,
      });
    }
    await User.findOneAndUpdate(
      { _id: userId },
      {
        $set: {
          wallet: userData.wallet + StockData.totalAmount,
        },
      }
    );
    await Stock.findOneAndDelete({ userId, _id: itemId });
    return send200(res, {
      status: true,
      message: MESSAGE.STOCK_DELETED,
    });
  } catch (error) {
    return send500(res, {
      status: false,
      message: error.message,
    });
  }
};

// const chain = async (req, res) => {
//   try {
//     const indexName = req.query.index;
//     const symbolName = req.query.symbol;
// console.log(
//   "console ind",
//   indexName ?? symbolName,
//   indexName ? "index" : "symbol"
// );

//     let resp = await getOptionChain(
//       indexName ?? symbolName,
//       indexName ? "index" : "symbol"
//     );
//     console.log("indexOrSymbol :>> ", resp);
//     res.json(resp);
//   } catch (err) {
//     res.status(500).json({ error: err });
//   }
// };

// const chain = async (req, res) => {
//   try {
//     const indexName = req.query.index;
//     const symbolName = req.query.symbol;

//     console.log(
//       "console ind",
//       indexName ?? symbolName,
//       indexName ? "index" : "symbol"
//     );

//     // Call the fetchNiftyOptionChain function and get the response
//     let resp;
//     if (indexName || symbolName) {
//       // Use the `index` or `symbol` parameter, based on the query.
//       resp = await fetchNiftyOptionChain();
//          console.log("indexOrSymbol :>> ", resp);
//     } else {
//       return res
//         .status(400)
//         .json({ error: "Missing index or symbol query parameter." });
//     }

//     console.log("indexOrSymbol :>> ", resp);
//     res.json(resp); // Send the response as JSON
//   } catch (err) {
//     console.error("Error fetching option chain:", err);
//     res
//       .status(500)
//       .json({ error: "Internal Server Error", message: err.message });
//   }
// };



export const chain = async (req, res) => {
  try {
    const indexName = req.query.index;
    const symbolName = req.query.symbol;

    console.log(
      "console ind:",
      indexName ?? symbolName,
      indexName ? "index" : "symbol"
    );

    let resp;
    if (indexName || symbolName) {
      // Call fetchOptionChain using either indexName or symbolName as the symbol
      const symbol = indexName || symbolName;
      resp = await fetchOptionChain(symbol);
      console.log("indexOrSymbol response:", resp);
    } else {
      return res
        .status(400)
        .json({ error: "Missing index or symbol query parameter." });
    }

    res.json(resp); // Send the response as JSON
  } catch (err) {
    console.error("Error fetching option chain:", err);
    res
      .status(500)
      .json({ error: "Internal Server Error", message: err.message });
  }
};

// Call the function
// (async () => {
//     try {
//         const data = await fetchOptionChain();
//         console.log('Option Chain Data:', data);
//     } catch (error) {
//         console.error('Failed to fetch data:', error.message);
//     }
// })();




export const exportStocksToExcel = async (req, res) => {
  const { startDate, endDate } = req.body;
  const userId = req.user._id;

  try {
    const query = {
      userId,
      buyDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      },
    };

    const stocks = await Stock.find(query).lean();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Stock Buy History');

    // Add headers
    worksheet.columns = [
      { header: 'Stock Name', key: 'stockName', width: 20 },
      { header: 'Symbol', key: 'symbol', width: 15 },
      { header: 'Type', key: 'type', width: 12 },
      { header: 'Stock Type', key: 'stockType', width: 12 },
      { header: 'Quantity', key: 'quantity', width: 10 },
      { header: 'Stock Price', key: 'stockPrice', width: 12 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Buy Date', key: 'buyDate', width: 20 },
      { header: 'Status', key: 'status', width: 10 },
    ];

    // Add data
    stocks.forEach(stock => {
      worksheet.addRow({
        ...stock,
        buyDate: new Date(stock.buyDate).toLocaleString(),
      });
    });

    // Write to buffer and send as download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=stock_report.xlsx'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    return send500(res, {
      status: false,
      message: 'Failed to export Excel',
    });
  }
};


// import puppeteer from 'puppeteer';
// import axios from 'axios';

// export const getOptionChain = async (req, res) => {
//   const symbol = req.query.index || 'NIFTY';
//   let browser;

//   try {
//     console.log('🚀 Launching Puppeteer...');
//     browser = await puppeteer.launch({
//       headless: true,
//       args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     });

//     const page = await browser.newPage();
//     await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
//     await page.setExtraHTTPHeaders({
//       'Accept-Language': 'en-US,en;q=0.9',
//     });

//     console.log('🌐 Visiting NSE Option Chain Page...');
//     await page.goto('https://www.nseindia.com/option-chain', {
//       waitUntil: 'domcontentloaded',
//       timeout: 15000,
//     });

//     await new Promise(resolve => setTimeout(resolve, 2000));

//     const cookies = await page.cookies();
//     const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

//     const apiUrl = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;
//     console.log(`📡 Fetching API with axios: ${apiUrl}`);

//     const response = await axios.get(apiUrl, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
//         'Accept': 'application/json',
//         'Referer': 'https://www.nseindia.com/option-chain',
//         'Cookie': cookieHeader,
//       },
//       timeout: 10000,
//     });

//     await browser.close();
//     return res.status(200).json(response.data);

//   } catch (err) {
//     console.error('❌ Puppeteer axios fetch failed:', err.message);
//     if (browser) await browser.close();
//     return res.status(500).json({
//       error: 'Failed to fetch option chain via Puppeteer',
//       details: err.message,
//     });
//   }
// };
import axios from 'axios';

export const getOptionChain = async (req, res) => {
  const symbol = req.query.index || 'NIFTY';
  const NSE_URL = `https://www.nseindia.com/api/option-chain-indices?symbol=${symbol}`;
  const SCRAPE_DO_TOKEN = 'dea816863e854d26a15e13b94d75bdc9f6c5229f342';

  // IMPORTANT: Enable JS rendering
  const SCRAPE_DO_ENDPOINT = `http://api.scrape.do?token=${SCRAPE_DO_TOKEN}&url=${encodeURIComponent(NSE_URL)}&render=true`;

  try {
    console.log('🌐 Fetching NSE Option Chain via Scrape.do with rendering...');
    const response = await axios.get(SCRAPE_DO_ENDPOINT, { timeout: 30000 });

    console.log('✅ Success from Scrape.do!');
    return res.status(200).json(response.data);

  } catch (error) {
    console.error('❌ Error fetching via Scrape.do:', error.message);
    return res.status(500).json({
      error: 'Failed to fetch option chain via Scrape.do',
      details: error.message,
    });
  }
};





const marketController = {
  addToWatchList,
  getWatchList,
  removeWatchListItem,
  buy,
  getMyStocks,
  getMyCommodities,
  squareOff,
  squareOffCommodity,
  getMyStockHistory,
  sell,
  decodeStockData,
  deleteStock,
  sellCommodity,
  buyCommodity,
  getNSELatestPrice,
  chain,
  createWatchlist,
  deleteWatchlist,
  getUserWatchlists,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  getSymbolsInWatchlist,
  getAllSymbolsByUser,
  exportStocksToExcel,getOptionChain
};

export default marketController;
