import Item from "../models/Item.js";

// 🔐 ENFORCE INVENTORY SETUP
export const requireSetup = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const exists = await Item.exists({ owner: userId });

    if (!exists) {
      return res.status(403).json({
        message: "Inventory setup required",
        setupRequired: true,
      });
    }

    next();
  } catch (err) {
    console.error("❌ Setup middleware error:", err);
    res.status(500).json({ message: "Server error" });
  }
};