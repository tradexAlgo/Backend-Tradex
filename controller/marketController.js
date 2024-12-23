import watchList from "../models/watchList.models.js";
import User from "../models/user.models.js";
import responseHelper from "../helpers/response.helper.js";
import { MESSAGE } from "../helpers/message.helper.js";
import Stock from "../models/stock.models.js";
import Queues from "../utils/queues.js";
import { nseData } from "nse-data";
import { getLTP } from "nse-quotes-api";
import getStockPrice from "../utils/getStockPrice.js";
import isBetween915AMAnd320PM from "../middleware/constants.js";
import next5DayDate from "../utils/next5DayDate.js";
import { Buffer } from "buffer";
import { fileURLToPath } from "url";
import { dirname } from "path";
import protobuf from "protobufjs";
import checkPrice from "../utils/checkPrice.js";
import commodityModels from "../models/commodity.models.js";
import checkPriceStockName from "../utils/checkPriceStockName.js";
import { getOptionChain, fetchNiftyOptionChain, fetchOptionChain } from "./nse_lib.js";


const { send200, send201, send403, send400, send401, send404, send500 } =
  responseHelper;

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
          buyDate: new Date(),
          status: "BUY",
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
          buyDate: new Date(),
          status: "BUY",
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
          buyDate: new Date(),
          status: "BUY",
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
          buyDate: new Date(),
          status: "BUY",
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
          buyDate: new Date(),
          status: "BUY",
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

  const { stockId, stockName, identifier, optionType,latestPriceData } = req.body;
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
    const PL = newPrice - totalAmount;

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
};

export default marketController;
