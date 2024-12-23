import mongoose from "mongoose";
const Schema = mongoose.Schema;

const commoditySchema = new Schema(
  {
    commodityName: {
      type: String,
      default: null,
    },
    symbol: {
      type: String,
      default: null,
    },
    totalAmount: {
      type: Number,
      default: null,
    },
    type: {
      type: String,
      enum: ["BUY", "SELL"], // Correct enum values for 'type'
      default: "BUY", // Default value must be one of the enum values
    },
    userId: {
      type: String,
      default: null,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    targetPrice: {
      type: Number,
      default: null,
    },
    commodityPrice: {
      type: Number,
      default: null,
    },
    stopLoss: {
      type: Number,
      default: null,
    },
    status: {
        type: String,
        enum: ["BUY", "PENDING", "COMPLETED", "CANCELLED","SELL"], // Add 'BUY' to the enum values if needed
        default: "PENDING",
      },
    netProfitAndLoss: {
      type: Number,
      default: null,
    },
    buyDate: {
      type: Date,
      default: null,
    },
    sellDate: {
      type: Date,
      default: null,
    },
    squareOff: {
      type: Boolean,
      default: false,
    },
    squareOffDate: {
      type: Date,
      default: null,
    },
    intervalId: {
      type: String,
      default: null,
    },
    executed: {
      type: Boolean,
      default: false,
    },
    failed: {
      type: Boolean,
      default: false,
    },
    toSquareOffOn: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Commodity", commoditySchema);
