import Item from "../models/Item.js";
import ItemType from "../models/ItemType.js";
import User from "../models/User.js";

// ✅ GET ITEM TYPES
export const getItemTypes = async (req, res) => {
  try {
     const types = await ItemType.find({
  departments: { $in: [req.user.department] }
});

    res.json(types);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ SETUP INVENTORY
export const setupInventory = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        message: "Admin cannot setup inventory"
      });
    }

    const items = req.body.items;

    const ids = items.map(i => i.itemType);
    if (ids.length !== new Set(ids).size) {
      return res.status(400).json({
        message: "Duplicate items not allowed"
      });
    }

    const existing = await Item.find({ owner: req.user.id });
    if (existing.length > 0) {
      return res.status(400).json({
        message: "Inventory already setup"
      });
    }

    const newItems = items.map(item => ({
      itemType: item.itemType,
      quantity: item.quantity,
      condition: item.condition,
      owner: req.user.id,
      department: req.user.department
    }));

    await Item.insertMany(newItems);

    await User.findByIdAndUpdate(req.user.id, {
      inventorySetupComplete: true
    });

    res.json({ message: "Inventory setup complete" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ ADMIN: GET ALL INVENTORY
export const getAllInventory = async (req, res) => {
  try {
    const items = await Item.find()
      .populate("owner", "email department")
      .populate("itemType", "name");

    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ✅ ADMIN: UPDATE CONDITION
export const updateCondition = async (req, res) => {
  try {
    const { condition } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      { condition, lastUpdated: Date.now() },
      { new: true }
    );

    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};