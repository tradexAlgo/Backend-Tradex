import mongoose from "mongoose";
const Schema = mongoose.Schema;

const userPaymentSchema = new Schema({
  QRImage: {
    type: String, // URL or base64 string of the QR code image
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  UPIId: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});


export default mongoose.model("PaymentInfo", userPaymentSchema);