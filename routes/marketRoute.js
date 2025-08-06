import express from "express";
const router = express.Router();
import marketController from "../controller/marketController.js";
import fyersController from "../controller/fyersController.js";
import verifyToken from "../utils/verifyToken.js";
const {
  addToWatchList,
  getWatchList,
  removeWatchListItem,
  buy,
  getMyStocks,
  squareOff,
  getMyStockHistory,
  sell,
  decodeStockData,
  deleteStock,
  buyCommodity,
  sellCommodity,
  getMyCommodities,
  squareOffCommodity,
  getNSELatestPrice,
  chain,
  createWatchlist,
  deleteWatchlist,
  getUserWatchlists,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  getSymbolsInWatchlist,
  getAllSymbolsByUser,
  exportStocksToExcel,
  getOptionChain
} = marketController;
const {
  generateAuthCode,
  getProfile,
  generateAccessToken,
  getQuotes,
  getQuotesV2,
  checkApiLimit
} = fyersController;


router.get('/chain', getOptionChain);

router.get("/watchlists/listbyuser", verifyToken, getAllSymbolsByUser);

router.post("/watchlists", verifyToken, createWatchlist);
router.get("/watchlists", verifyToken, getUserWatchlists);
router.post("/watchlists/:id", verifyToken, deleteWatchlist);

router.post("/watchlistst/symbol", addSymbolToWatchlist);
router.post("/watchlists/:watchlistId/symbol/:symbol", verifyToken, removeSymbolFromWatchlist);
router.get("/watchlists/:watchlistId/items", verifyToken, getSymbolsInWatchlist);






router.post("/addtowatchlist", verifyToken, addToWatchList);
router.post("/exportStocksToExcel", verifyToken, exportStocksToExcel);
router.get("/getwatchlist/:page?", verifyToken, getWatchList);

router.get("/generateAuthCode", generateAuthCode);

router.get("/getProfile", getProfile);
router.get("/generateAccessToken", generateAccessToken);
router.get("/checkApiLimit", checkApiLimit);
router.post("/getQuotes", getQuotes);
router.post("/getQuotesV2", getQuotesV2);
router.get("/chain", chain);

router.delete("/removewatchlistitem/:symbol", verifyToken, removeWatchListItem);
router.post("/buy", verifyToken, buy);
router.get("/getmystocks/:type?", verifyToken, getMyStocks);
router.get("/getmystocksCommodity/:type?", verifyToken, getMyCommodities);
router.post("/squareoff", verifyToken, squareOff);
router.post("/getNSELatestPrice", verifyToken, getNSELatestPrice);
router.post("/squareOffCommodity", verifyToken, squareOffCommodity);
router.get("/getmystockhistory", verifyToken, getMyStockHistory);
router.post("/sell", verifyToken, sell);
router.post("/buyCommodity", verifyToken, buyCommodity);
router.post("/sellCommodity", verifyToken, sellCommodity);
router.delete("/deletestock/:id", verifyToken, deleteStock);
router.post("/decodestockdata", decodeStockData);
// Testing route
//done
router.get("*", (req, res) => {
  res.status(200).json({ message: "The API is working!" });
});

export default router;
