import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemType",
      required: true,
    },

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    requiredDate: {
      type: Date,
      required: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    priority: {
      type: String,
      enum: ["very_important", "important", "not_important"],
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);