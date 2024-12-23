import mongoose from "mongoose";

const Schema = mongoose.Schema;

const appIntroSchema = new Schema(
  {
    introTitle: {
      type: String,
      required: true,
    },
    introDescription: {
      type: String,
      required: true,
    },
    introHashtags: {
      type: [String], // Array of hashtags
      default: [],
    },
    introBanner: {
      type: String, // URL of the uploaded banner image
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("AppIntro", appIntroSchema);
