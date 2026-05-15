import mongoose from "mongoose";

// =========================
// REQUEST ITEM SUB SCHEMA
// =========================
const requestItemSchema = new mongoose.Schema({
  // predefined item type
  itemType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ItemType",
    default: null,
  },

  // custom item name
  customItemName: {
    type: String,
    trim: true,
    default: "",
  },

  // quantity requested
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },

  // quantity approved
  approvedQuantity: {
    type: Number,
    default: 0,
  },

  // extra details
  description: {
    type: String,
    trim: true,
    default: "",
  },

  // item approval status
  itemStatus: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
});

// =========================
// MAIN REQUEST SCHEMA
// =========================
const requestSchema = new mongoose.Schema(
  {
    // requester
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // requester department
    department: {
      type: String,
      required: true,
      trim: true,
    },

    // required date
    requiredDate: {
      type: Date,
      required: true,
    },

    // 🔥 WHOLE REQUEST PRIORITY
    priority: {
      type: String,
      enum: [
        "very_important",
        "important",
        "not_important",
      ],
      required: true,
      default: "important",
    },

    // requested items
    items: {
      type: [requestItemSchema],

      validate: {
        validator: function (items) {
          return items.length > 0;
        },

        message: "At least one item is required",
      },
    },

    // overall request status
    status: {
      type: String,

      enum: [
        "pending",
        "partially_approved",
        "approved",
        "rejected",
      ],

      default: "pending",
    },

    // optional remarks
    remarks: {
      type: String,
      trim: true,
      default: "",
    },
  },

  { timestamps: true }
);

export default mongoose.model("Request", requestSchema);