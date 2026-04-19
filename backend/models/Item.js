import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ItemType",
    required: true,
  },

  quantity: {
    type: Number,
    required: true,
  },

  condition: {
    type: String,
    enum: ["good", "fair", "poor"],
    default: "good",
  },

  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  department: String,

  lastUpdated: {
    type: Date,
    default: Date.now,
  }
});

// 🔥 prevent duplicates per user + item type
itemSchema.index({ owner: 1, itemType: 1 }, { unique: true });

const Item = mongoose.model("Item", itemSchema);

export default Item;