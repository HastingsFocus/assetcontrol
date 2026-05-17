import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // =========================
    // NOTIFICATION TYPE
    // =========================
    type: {
      type: String,
      enum: [
        "request_created",
        "request_updated",
        "request_approved",
        "request_rejected",
        "status_updated",
        "edit_access_requested",
        "edit_access_decided",
        "inventory_updated",
      ],
      default: "status_updated",
      index: true,
    },

    // =========================
    // LINKS (FUTURE PROOFING)
    // =========================
    request: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
    },

    editRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EditRequest",
    },

    // =========================
    // CONTEXT INFO
    // =========================
    department: {
      type: String,
      index: true,
    },

    itemName: {
      type: String,
    },

    // =========================
    // READ STATUS
    // =========================
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Notification", notificationSchema);