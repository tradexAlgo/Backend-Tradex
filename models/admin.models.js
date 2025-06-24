import mongoose from "mongoose";

const Schema = mongoose.Schema;

const adminSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "SUB_ADMIN", "BROKER"],
      required: true,
    },
    brokerCode: {
      type: String,
      unique: true,
      sparse: true, // only applies to BROKER role
    },
    features: {
      type: [String], // Array of feature strings
      default: [],
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
    },
    depositUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
    }
  },
  { timestamps: true }
);

export default mongoose.model("admin", adminSchema);
