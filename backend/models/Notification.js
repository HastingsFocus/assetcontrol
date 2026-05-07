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
      enum: [
        "request_created",
        "status_updated",
        "edit_access_requested",
        "edit_access_decided",
      ],
      default: "status_updated",
    },

    // 🔥 LINK TO REQUEST (VERY IMPORTANT)
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: false, // optional but useful
    },

    // 🔗 LINK TO EDIT REQUEST (for inventory edit-access notifications)
    editRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EditRequest",
      required: false,
    },
    department: {
      type: String,
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