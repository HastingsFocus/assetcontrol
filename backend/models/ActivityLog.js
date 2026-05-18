import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  email: String,

  role: String,

  action: {
    type: String,
    required: true,
    enum: [
      "LOGIN",
      "LOGOUT",
      "USER_REGISTERED",
      "REQUEST_CREATED",
      "REQUEST_UPDATED",
      "REQUEST_APPROVED",
      "REQUEST_REJECTED",
      "REQUEST_COMPLETED",
      "USER_DELETED",
    ],
  },

  targetId: String, // requestId or userId or null

  metadata: Object,

  ipAddress: String,

  userAgent: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model("ActivityLog", activityLogSchema);