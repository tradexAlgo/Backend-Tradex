import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userPaymentSchema = new Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
    type: {
      type: String,
      enum: ["DEPOSIT", "WITHDRAW"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    transactionId: {
      type: String,
      default: null, // Used for deposits
    },
    upiId: {
      type: String,
      default: null, // Used for withdrawals
    },
    currency: {
      type: String,
      required: true,
    },
    gateway: {
      type: String,
      default: null, // Used for withdrawals
    },
    status: {
      type: String,
      enum: ["PENDING", "ACCEPTED", "REJECTED"],
      default: "PENDING",
    },
    clientUp: {
      type: String,
      default: null, // Optional field sent by client
    },
  },
  { timestamps: true }
);

export default mongoose.model("userPayment", userPaymentSchema);
