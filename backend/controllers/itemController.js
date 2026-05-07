import Item from "../models/Item.js";
import ItemType from "../models/ItemType.js";
import User from "../models/User.js";
import { broadcastInventoryUpdate } from "../socket.js";
import { ensureCanEditInventory } from "./editRequestController.js";

// Shared 403 message for blocked inventory mutations.
const lockedResponse = (res, reason) => {
  const message =
    reason === "pending"
      ? "Your edit request is pending admin approval."
      : "Inventory is locked. Request edit access to make changes.";
  return res.status(403).json({ message, locked: true, reason });
};


export const checkSetup = async (req, res) => {
  try {
    const exists = await Item.exists({
      owner: req.user._id,
    });

    res.json({
      isSetup: !!exists,
    });

  } catch (err) {
    console.error("❌ CHECK SETUP ERROR:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};
// ==========================
// ✅ GET ITEM TYPES (BY DEPARTMENT)
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
    console.error("❌ GET ITEM TYPES ERROR:", err);
    res.status(500).json({ message: "Failed to fetch item types" });
  }
};


export const setupInventory = async (req, res) => {
  try {
    const userId = req.user._id;

    if (req.user.role === "admin") {
      return res.status(403).json({
        message: "Admin cannot manage inventory",
      });
    }

    // First-time setup is allowed; subsequent overwrites need approved edit access.
    const gate = await ensureCanEditInventory(userId);
    if (!gate.allowed) {
      return lockedResponse(res, gate.reason);
    }

    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({
        message: "No items provided",
      });
    }

    // 🚫 prevent duplicate item types in request
    const ids = items.map((i) => i.itemType);
    if (ids.length !== new Set(ids).size) {
      return res.status(400).json({
        message: "Duplicate items not allowed",
      });
    }

    // 🔥 validation
    for (let item of items) {
      const total =
        (item.conditions?.good || 0) +
        (item.conditions?.fair || 0) +
        (item.conditions?.poor || 0);

      if (total <= 0) {
        return res.status(400).json({
          message: "Each item must have at least one quantity",
        });
      }
    }

    // ⚠️ prevent duplicate full setup
    await Item.deleteMany({ owner: userId });

    // 🔥 format items
    const formatted = items.map((item) => {
      const good = item.conditions?.good || 0;
      const fair = item.conditions?.fair || 0;
      const poor = item.conditions?.poor || 0;

      return {
        itemType: item.itemType,
        owner: userId,
        department: req.user.department,
        conditions: { good, fair, poor },
        totalQuantity: good + fair + poor,
      };
    });

    await Item.insertMany(formatted);

    

    // 🔥 real-time update
    broadcastInventoryUpdate({
      message: "Inventory updated",
      department: req.user.department,
      owner: userId,
    });

    res.json({
      message: "Inventory saved successfully",
    });

  } catch (error) {
    console.error("❌ SETUP INVENTORY ERROR:", error);
    res.status(500).json({
      message: "Failed to save inventory",
    });
  }
};


export const getMyInventory = async (req, res) => {
  try {
    const items = await Item.find({
      owner: req.user._id,
    }).populate("itemType", "name");

    res.json(items);

  } catch (error) {
    console.error("❌ GET MY INVENTORY ERROR:", error);
    res.status(500).json({
      message: "Failed to fetch inventory",
    });
  }
};

export const getAllInventory = async (req, res) => {
  try {
    if (!["admin", "hod"].includes(req.user.role)) {
      return res.status(403).json({
        message: "Not allowed",
      });
    }

    const items = await Item.find()
      .populate("owner", "email department")
      .populate("itemType", "name");

    const enriched = items.map((item) => {
      const c = item.conditions || {};

      return {
        ...item.toObject(),
        department: item.department || item.owner?.department,
        itemTypeName: item.itemType?.name,
        totalQuantity:
          (c.good || 0) + (c.fair || 0) + (c.poor || 0),
      };
    });

    res.json(enriched);

  } catch (err) {
    console.error("❌ GET ALL INVENTORY ERROR:", err);
    res.status(500).json({
      message: "Server error",
    });
  }
};


export const updateMyItem = async (req, res) => {
  try {
    const { id } = req.params;

    // =========================
    // 🔒 VALIDATION: ID CHECK
    // =========================
    if (!id || id === "null") {
      return res.status(400).json({
        message: "Invalid item ID",
      });
    }

    const gate = await ensureCanEditInventory(req.user._id);
    if (!gate.allowed) {
      return lockedResponse(res, gate.reason);
    }

    const item = await Item.findOne({
      _id: id,
      owner: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found or unauthorized",
      });
    }

       if (req.body.itemType) {
      item.itemType = req.body.itemType;
    }

    // 🔥 Ensure conditions exist safely
    if (req.body.conditions) {
      item.conditions = {
        good: req.body.conditions.good || 0,
        fair: req.body.conditions.fair || 0,
        poor: req.body.conditions.poor || 0,
      };
    }

    item.lastUpdated = new Date();

    await item.save();

    return res.json(item);

  } catch (error) {
    console.error("❌ UPDATE ITEM ERROR:", error);

    return res.status(500).json({
      message: "Update failed",
    });
  }
};


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
        lastUpdated: Date.now(),
      },
      { new: true }
    );

    res.json(item);

  } catch (err) {
    console.error("❌ UPDATE CONDITION ERROR:", err);
    res.status(500).json({
      message: "Update failed",
    });
  }
};

export const deleteMyItem = async (req, res) => {
  try {
    const gate = await ensureCanEditInventory(req.user._id);
    if (!gate.allowed) {
      return lockedResponse(res, gate.reason);
    }

    const item = await Item.findOneAndDelete({
      _id: req.params.id,
      owner: req.user._id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.json({
      message: "Item deleted successfully",
    });

  } catch (err) {
    console.error("❌ DELETE ERROR:", err);
    res.status(500).json({
      message: "Delete failed",
    });
  }
};

export const createMyItem = async (req, res) => {
  try {
    const { itemType, conditions } = req.body;

    if (!itemType) {
      return res.status(400).json({ message: "Item type required" });
    }

    // Adding a brand-new item is always allowed — only edits/deletes need approval.

    const item = await Item.create({
      itemType,
      owner: req.user._id,
      department: req.user.department,
      conditions: conditions || { good: 0, fair: 0, poor: 0 },
      lastUpdated: new Date(),
    });

    res.status(201).json(item);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Create failed" });
  }
};
