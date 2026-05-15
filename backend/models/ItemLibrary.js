import mongoose from "mongoose";

const itemLibrarySchema = new mongoose.Schema(
  {
    // who created/owns this reusable item
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // final display name (custom or system-derived)
    name: {
      type: String,
      required: true,
      trim: true,
    },

    // link to item type (optional but recommended)
    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemType",
    },

    // how many times this item has been used in requisitions
    usageCount: {
      type: Number,
      default: 0,
    },

    // admin approval flag
    isApproved: {
      type: Boolean,
      default: false,
    },

    // becomes true when usageCount >= 2 OR admin approves
    isReusable: {
      type: Boolean,
      default: false,
    },

    // optional tracking
    createdFrom: {
      type: String,
      enum: ["custom", "system"],
      default: "custom",
    },
  },
  {
    timestamps: true,
  }
);

const ItemLibrary = mongoose.model("ItemLibrary", itemLibrarySchema);

export default ItemLibrary;