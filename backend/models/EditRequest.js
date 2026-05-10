import mongoose from "mongoose";

const editRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "completed", "revoked"],
      default: "pending",
    },

    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    decidedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Quick lookup of a user's currently active edit access (pending or approved).
editRequestSchema.index({ user: 1, status: 1 });

export default mongoose.model("EditRequest", editRequestSchema);
