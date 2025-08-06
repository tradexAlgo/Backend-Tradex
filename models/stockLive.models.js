import mongoose from "mongoose";

const stockLiveSchema = new mongoose.Schema(
  {
    symbol: { type: String, required: true, unique: true },
    data: { type: mongoose.Schema.Types.Mixed },
    lastUpdated: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default mongoose.model("StockLive", stockLiveSchema);
