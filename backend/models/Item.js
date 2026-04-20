import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  itemType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ItemType",
    required: true,
  },

  // 🔥 NEW STRUCTURE
  conditions: {
    good: { type: Number, default: 0 },
    fair: { type: Number, default: 0 },
    poor: { type: Number, default: 0 },
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

// 🔥 VIRTUAL FIELD (AUTO TOTAL)
itemSchema.virtual("totalQuantity").get(function () {
  return (
    (this.conditions.good || 0) +
    (this.conditions.fair || 0) +
    (this.conditions.poor || 0)
  );
});

// 🔥 INCLUDE VIRTUALS IN JSON RESPONSE
itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

// 🔥 prevent duplicates per user + item type
itemSchema.index({ owner: 1, itemType: 1 }, { unique: true });

const Item = mongoose.model("Item", itemSchema);

export default Item;