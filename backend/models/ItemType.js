import mongoose from "mongoose";

const itemTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },

  departments: [
    {
      type: String,
    }
  ]
});

const ItemType = mongoose.model("ItemType", itemTypeSchema);

export default ItemType;