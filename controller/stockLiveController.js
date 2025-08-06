import StockLive from "../models/StockLive.js";

export const getLiveQuotes = async (req, res) => {
  const { symbols } = req.body;

  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({
      status: false,
      message: "Symbols array is required.",
    });
  }

  try {
    const data = await StockLive.find({ symbol: { $in: symbols } });
    return res.status(200).json({
      status: true,
      data,
      message: "Fetched live quotes from DB",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: "Failed to fetch live quotes.",
      error: error.message,
    });
  }
};
