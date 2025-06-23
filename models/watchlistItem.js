import mongoose from "mongoose";
const Schema = mongoose.Schema;

const watchlistItemSchema = new Schema(
  {
    watchlistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "watchlist",
      required: true,
    },
    symbol: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("watchlistitem", watchlistItemSchema);
