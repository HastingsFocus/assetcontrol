import Request from "../models/Request.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ItemType from "../models/ItemType.js";
import { sendNotification, io } from "../socket.js"; // 🔥 include io
import Item from "../models/Item.js";

// ===============================
// ✅ CREATE REQUEST (HOD)
// ===============================
export const createRequest = async (req, res) => {
  try {
    const { itemType, requiredDate, quantity, priority } = req.body;

    if (!itemType || !requiredDate || !quantity || !priority) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const type = await ItemType.findById(itemType);

    if (!type) {
      return res.status(404).json({
        message: "Item type not found",
      });
    }

    if (!type.departments.includes(req.user.department)) {
      return res.status(403).json({
        message: "Item not allowed for your department",
      });
    }

    const request = await Request.create({
      user: req.user._id,
      itemType,
      itemName: type.name,
      requiredDate,
      quantity,
      priority,
      status: "pending",
      department: req.user.department,
    });

    // 🔥 FIND ADMINS
    const admins = await User.find({ role: "admin" });

    // 🔥 NOTIFY ADMINS
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        message: `New request for ${type.name}`,
        type: "request_created",
        request: request._id,
      });

      sendNotification(admin._id, {
        message: `New request for ${type.name}`,
        type: "request_created",
        request: request._id,
      });
    }

    res.status(201).json({
      message: "Request submitted successfully",
      request,
    });

  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

// ===============================
// ✅ GET MY REQUESTS
// ===============================
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// ✅ GET ALL REQUESTS (ADMIN)
// ===============================
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("user", "name email department")
      .populate("itemType", "name")
      .sort({ createdAt: -1 });

    const safeRequests = requests.map((r) => ({
      ...r.toObject(),
      user: r.user || {
        name: "Unknown",
        email: "Unknown",
        department: "Unknown",
      },
      itemType: r.itemType || { name: "Deleted Item" },
    }));

    res.json(safeRequests);
  } catch (error) {
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

export const updateRequestStatus = async (req, res) => {
  try {
    const { status, approvedQuantity } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // 🔥 FETCH REQUEST WITH FULL USER DATA (FIXED)
    const request = await Request.findById(req.params.id)
      .populate("itemType", "name")
      .populate("user", "_id department"); // ✅ include _id

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    const updateData = {};

    // ============================
    // STATUS UPDATE
    // ============================
    if (status) {
      if (request.status === status) {
        return res.status(400).json({
          message: `Request is already ${status}`,
        });
      }

      updateData.status = status;
    }

    // ============================
    // APPROVED QUANTITY
    // ============================
    if (approvedQuantity !== undefined) {
      if (approvedQuantity <= 0) {
        return res.status(400).json({
          message: "Approved quantity must be greater than 0",
        });
      }

      if (approvedQuantity > request.quantity) {
        return res.status(400).json({
          message: "Approved quantity cannot exceed requested quantity",
        });
      }

      updateData.approvedQuantity = approvedQuantity;
    }
     
    // ============================
    // INVENTORY UPDATE (ONLY ON APPROVE)
    // ============================
    if (status === "approved") {
      const qtyToAdd =
        approvedQuantity ?? request.approvedQuantity ?? request.quantity;

      const department = request.user.department;

      let item = await Item.findOne({
        itemType: request.itemType._id,
        owner: request.user._id,
      });

      if (!item) {
        item = await Item.create({
          itemType: request.itemType._id,
          department,
          owner: request.user._id,
          conditions: { good: 0, fair: 0, poor: 0 },
        });
      }

      item.conditions.good += qtyToAdd;
      item.lastUpdated = new Date();

      await item.save();

      console.log("📦 Inventory updated for user:", request.user._id);

      // 🔥 REAL-TIME INVENTORY UPDATE
      io.emit("inventoryUpdated", {
        itemType: request.itemType._id,
        department,
      });
    }

    // ============================
    // UPDATE REQUEST
    // ============================
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("itemType", "name");

    // ============================
    // 🔔 NOTIFICATIONS (DEBUG + SAFE)
    // ============================
    if (status === "approved" || status === "rejected") {
      const message =
        status === "approved"
          ? `Your request for ${request.itemType.name} was approved`
          : `Your request for ${request.itemType.name} was rejected`;

      console.log("🔔 Creating notification...");
      console.log("👤 Target user:", request.user?._id);
      console.log("📩 Message:", message);

      // 🔥 SAVE TO DB
      const notification = await Notification.create({
        user: request.user._id,
        message,
        type: "status_updated",
        request: request._id,
      });

      console.log("✅ Notification saved:", notification);

      // 🔥 REAL-TIME SEND
      sendNotification(request.user._id, {
        _id: notification._id, // include ID for frontend
        message,
        type: "status_updated",
        request: request._id,
        createdAt: notification.createdAt,
        isRead: false,
      });

      console.log("📡 Notification emitted via socket");
    }

    res.json({
      message: "Request updated successfully",
      request: updatedRequest,
    });

  } catch (error) {
    console.error("❌ updateRequestStatus error:", error);
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};