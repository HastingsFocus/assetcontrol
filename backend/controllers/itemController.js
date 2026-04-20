import Item from "../models/Item.js";
import ItemType from "../models/ItemType.js";
import User from "../models/User.js";
import { broadcastInventoryUpdate } from "../socket.js"; // ✅ CORRECT IMPORT

// ==========================
// ✅ GET ITEM TYPES (FILTERED BY DEPARTMENT)
// ==========================
export const getItemTypes = async (req, res) => {
  try {
    const dept = req.user.department?.trim();

    const types = await ItemType.find({
      departments: { $in: [dept] }
    });

    res.json(types);
  } catch (err) {
    console.error("❌ ERROR IN getItemTypes:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// ✅ SETUP INVENTORY (REAL-TIME ENABLED)
// ==========================
export const setupInventory = async (req, res) => {
  try {
    // 🚫 block admin
    if (req.user.role === "admin") {
      return res.status(403).json({
        message: "Admin cannot setup inventory"
      });
    }

    const items = req.body.items;

    // 🚫 duplicate check
    const ids = items.map(i => i.itemType);
    if (ids.length !== new Set(ids).size) {
      return res.status(400).json({
        message: "Duplicate items not allowed"
      });
    }

    // 🚫 prevent multiple setups
    const existing = await Item.find({ owner: req.user.id });
    if (existing.length > 0) {
      return res.status(400).json({
        message: "Inventory already setup"
      });
    }

    // 🔥 validation
    for (let item of items) {
      const good = item.conditions?.good || 0;
      const fair = item.conditions?.fair || 0;
      const poor = item.conditions?.poor || 0;

      if (good + fair + poor <= 0) {
        return res.status(400).json({
          message: "Each item must have at least one quantity"
        });
      }
    }

    // ✅ create items
    const newItems = items.map(item => ({
      itemType: item.itemType,
      conditions: {
        good: item.conditions?.good || 0,
        fair: item.conditions?.fair || 0,
        poor: item.conditions?.poor || 0,
      },
      owner: req.user.id,
      department: req.user.department
    }));

    await Item.insertMany(newItems);

    // ✅ mark setup complete
    await User.findByIdAndUpdate(req.user.id, {
      inventorySetupComplete: true
    });

    // 🔥🔥🔥 REAL-TIME BROADCAST
    broadcastInventoryUpdate({
      message: "New inventory submitted",
      department: req.user.department,
      user: req.user.id
    });

    console.log("📡 Inventory broadcast sent");

    res.json({ message: "Inventory setup complete" });

  } catch (err) {
    console.error("❌ SETUP ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};



export const setupInventoryUpdate = async (req, res) => {
  try {
    const updated = await Item.updateMany(
      {}, 
      { $set: req.body }
    );

    res.json({
      message: "Inventory updated successfully",
      updated,
    });
  } catch (err) {
    res.status(500).json({ message: "Update failed" });
  }
};

// ==========================
// ✅ ADMIN: GET ALL INVENTORY
// ==========================
export const getAllInventory = async (req, res) => {
  try {
    console.log("🔥 USER ACCESSING INVENTORY:", req.user);

    if (!["admin", "hod"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const items = await Item.find()
      .populate("owner", "email department")
      .populate("itemType", "name");

    console.log("🔥 ITEMS FOUND:", items.length);

    const enriched = items.map(item => {
      const c = item.conditions || {};

      return {
        ...item.toObject(),
        totalQuantity: (c.good || 0) + (c.fair || 0) + (c.poor || 0)
      };
    });

    res.json(enriched);

  } catch (err) {
    console.error("❌ GET ALL INVENTORY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// ✅ ADMIN: UPDATE CONDITIONS
// ==========================
export const updateCondition = async (req, res) => {
  try {
    const { conditions } = req.body;

    const item = await Item.findByIdAndUpdate(
      req.params.id,
      {
        conditions: {
          good: conditions?.good || 0,
          fair: conditions?.fair || 0,
          poor: conditions?.poor || 0,
        },
        lastUpdated: Date.now()
      },
      { new: true }
    );

    res.json(item);

  } catch (err) {
    console.error("❌ UPDATE CONDITION ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};