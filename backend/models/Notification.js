import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    type: {
      type: String,
      enum: ["request_created", "status_updated"],
      default: "status_updated",
    },

    // 🔥 LINK TO REQUEST (VERY IMPORTANT)
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: false, // optional but useful
    },

    // 🔴 FOR UNREAD COUNT
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

export default mongoose.model("Notification", notificationSchema);