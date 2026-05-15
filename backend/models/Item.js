import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
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

    // item conditions
    conditions: {
      good: {
        type: Number,
        default: 0,
        min: 0,
      },

      fair: {
        type: Number,
        default: 0,
        min: 0,
      },

      poor: {
        type: Number,
        default: 0,
        min: 0,
      },
    },

    // owner
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // department
    department: {
      type: String,
      required: true,
      trim: true,
    },

    // last updated
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// =========================
// VIRTUAL TOTAL QUANTITY
// =========================
itemSchema.virtual("totalQuantity").get(function () {
  return (
    (this.conditions.good || 0) +
    (this.conditions.fair || 0) +
    (this.conditions.poor || 0)
  );
});

// =========================
// ENABLE VIRTUALS
// =========================
itemSchema.set("toJSON", { virtuals: true });
itemSchema.set("toObject", { virtuals: true });

// =========================
// INDEXES (FIXED PROPERLY)
// =========================

// PREDEFINED ITEMS (ONLY itemType exists)
itemSchema.index(
  {
    owner: 1,
    itemType: 1,
    department: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      itemType: { $type: "objectId" },
    },
  }
);

// CUSTOM ITEMS (STRICT UNIQUE PER NAME)
itemSchema.index(
  {
    owner: 1,
    department: 1,
    customItemName: 1,
  },
  {
    unique: true,
    partialFilterExpression: {
      itemType: null,
    },
  }
);

const Item = mongoose.model("Item", itemSchema);

export default Item;