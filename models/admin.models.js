import mongoose from "mongoose";

const Schema = mongoose.Schema;

const adminSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "SUB_ADMIN"],
      required: true,
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
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin",
    },
    permissions: {
      canCreateAdmin: {
        type: Boolean,
        default: false,
      },
      canDeleteAdmin: {
        type: Boolean,
        default: false,
      },
      canManageUsers: {
        type: Boolean,
        default: false,
      },
      // Additional permissions can be added here
    },
  },
  { timestamps: true }
);

export default mongoose.model("admin", adminSchema);
