import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    itemType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ItemType",
      required: true,
    },

    conditions: {
      good: { type: Number, default: 0, min: 0 },
      fair: { type: Number, default: 0, min: 0 },
      poor: { type: Number, default: 0, min: 0 },
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    department: {
      type: String,
      required: true,
      trim: true,
    },

    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// VIRTUAL FIELD (DO NOT EDIT DIRECTLY)
itemSchema.virtual("totalQuantity").get(function () {
  return (
    (this.conditions.good || 0) +
    (this.conditions.fair || 0) +
    (this.conditions.poor || 0)
  );
});

// ENABLE VIRTUALS
itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

// INDEX
itemSchema.index(
  { owner: 1, itemType: 1, department: 1 },
  { unique: true }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;