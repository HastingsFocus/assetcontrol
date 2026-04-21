import Item from "../models/Item.js";
import ItemType from "../models/ItemType.js";
import User from "../models/User.js";
import { broadcastInventoryUpdate } from "../socket.js";

// ==========================
// ✅ GET ITEM TYPES (FILTERED BY DEPARTMENT)
// ==========================
export const getItemTypes = async (req, res) => {
  try {
    const dept = req.user.department;

    if (!dept) {
      return res.status(400).json({
        message: "User department not found",
      });
    }

    const types = await ItemType.find({
      departments: { $in: [dept] },
    }).select("name departments");

    res.json(types);
  } catch (err) {
    console.error("❌ ERROR:", err);
    res.status(500).json({ message: "Failed to fetch item types" });
  }
};

// ==========================
// ✅ SETUP INVENTORY
// ==========================
export const setupInventory = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        message: "Admin cannot manage inventory"
      });
    }

    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No items provided"
      });
    }

    // 🚫 duplicate protection
    const ids = items.map(i => i.itemType);
    if (ids.length !== new Set(ids).size) {
      return res.status(400).json({
        message: "Duplicate items not allowed"
      });
    }

    // 🔥 VALIDATION
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

    // 🔥 DELETE ONLY THIS USER’S OLD INVENTORY
    await Item.deleteMany({ owner: req.user.id });

    // 🔥 FORMAT DATA
    const formatted = items.map((item) => {
      const good = item.conditions?.good || 0;
      const fair = item.conditions?.fair || 0;
      const poor = item.conditions?.poor || 0;

      return {
        itemType: item.itemType,
        owner: req.user.id, // ✅ FIXED
        department: req.user.department,
        conditions: {
          good,
          fair,
          poor,
        },
        totalQuantity: good + fair + poor,
      };
    });

    // ✅ SAVE
    await Item.insertMany(formatted);

    // ✅ MARK USER
    await User.findByIdAndUpdate(req.user.id, {
      inventorySetupComplete: true,
    });

    // 🔥 REAL-TIME UPDATE
    broadcastInventoryUpdate({
      message: "Inventory updated",
      department: req.user.department,
      owner: req.user.id, // ✅ FIXED
    });

    console.log("📡 Inventory update broadcast sent");

    res.json({ message: "Inventory saved successfully" });

  } catch (error) {
    console.error("❌ INVENTORY SAVE ERROR:", error);
    res.status(500).json({ message: "Failed to save inventory" });
  }
};



// ==========================
// ✅ GET MY INVENTORY
// ==========================
export const getMyInventory = async (req, res) => {
  try {
    const items = await Item.find({ owner: req.user.id }) // ✅ FIXED
      .populate("itemType", "name");

    res.json(items);
  } catch (error) {
    console.error("❌ GET MY INVENTORY ERROR:", error);
    res.status(500).json({ message: "Failed to fetch inventory" });
  }
};

// ==========================
// ✅ ADMIN: GET ALL INVENTORY
// ==========================
export const getAllInventory = async (req, res) => {
  try {
    if (!["admin", "hod"].includes(req.user.role)) {
      return res.status(403).json({ message: "Not allowed" });
    }

    const items = await Item.find()
      .populate("owner", "email department")
      .populate("itemType", "name");

    // 🔥 ENRICH DATA (THIS IS YOUR INTEGRATION)
    const enriched = items.map(item => {
      const c = item.conditions || {};

      return {
        ...item.toObject(),
        department: item.department || item.owner?.department, // ✅ FIX
        itemTypeName: item.itemType?.name, // ✅ easier frontend
        totalQuantity: (c.good || 0) + (c.fair || 0) + (c.poor || 0),
      };
    });

    res.json(enriched);

  } catch (err) {
    console.error("❌ GET ALL INVENTORY ERROR:", err);
    res.status(500).json({ message: err.message });
  }
};

// ==========================
// ✅ UPDATE ITEM (USER SAFE)
// ==========================
export const updateMyItem = async (req, res) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      owner: req.user.id, // ✅ FIXED
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    Object.assign(item, req.body);
    item.lastUpdated = Date.now();

    await item.save();

    res.json(item);
  } catch (error) {
    console.error("❌ UPDATE MY ITEM ERROR:", error);
    res.status(500).json({ message: "Update failed" });
  }
};

// ==========================
// ✅ ADMIN UPDATE CONDITION
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

export const deleteMyItem = async (req, res) => {
  try {
    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      owner: req.user.id,
    });

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("DELETE ERROR:", err);
    res.status(500).json({ message: "Delete failed" });
  }
};