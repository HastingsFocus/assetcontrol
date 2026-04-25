import Request from "../models/Request.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ItemType from "../models/ItemType.js"; // 🔥 IMPORTANT FIX
import { sendNotification } from "../socket.js";

// ===============================
// ✅ CREATE REQUEST (HOD)
// ===============================
export const createRequest = async (req, res) => {
  try {
    const { itemType, requiredDate, quantity, priority } = req.body;

    // ✅ Validation
    if (!itemType || !requiredDate || !quantity || !priority) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    console.log("🔥 Creating request...");

    // 🔐 SECURITY CHECK: VALIDATE ITEM TYPE + DEPARTMENT
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

    // ✅ Create request
    const request = await Request.create({
      user: req.user._id,
      itemType,
      itemName: type.name, // 🔥 derive name from DB (clean + safe)
      requiredDate,
      quantity,
      priority,
      status: "pending",
    });

    // 🔥 FIND ADMINS
    const admins = await User.find({ role: "admin" });

    console.log("👥 Admins found:", admins.length);

    // 🔥 NOTIFY ADMINS
    for (const admin of admins) {
      console.log("📢 Notifying admin:", admin._id);

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
    console.error("❌ Create request error:", error);
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};

// ===============================
// ✅ GET MY REQUESTS (HOD)
// ===============================
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({ user: req.user._id })
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("❌ getMyRequests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ===============================
// ✅ GET ALL REQUESTS (ADMIN)
// ===============================
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate({
        path: "user",
        select: "name email department",
      })
      .populate({
        path: "itemType",
        select: "name",
      })
      .sort({ createdAt: -1 });

    // 🔥 safety cleanup (prevents frontend crash)
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
    console.error("❌ getAllRequests error:", error);
    res.status(500).json({
      message: error.message || "Server error in getAllRequests",
    });
  }
};

// ===============================
// ✅ UPDATE STATUS (ADMIN)
// ===============================
export const updateRequestStatus = async (req, res) => {
  try {
    const { status, approvedQuantity } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];

    if (!validStatuses.includes(status) && status !== undefined) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    // 🔍 Get request
    const request = await Request.findById(req.params.id)
      .populate("itemType", "name");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    console.log("🔄 Updating request...");

    const updateData = {};

    // ================================
    // 1️⃣ STATUS UPDATE (Approve/Reject)
    // ================================
    if (status) {
      if (request.status === status) {
        return res.status(400).json({
          message: `Request is already ${status}`,
        });
      }

      updateData.status = status;
    }

    // ================================
    // 2️⃣ APPROVED QUANTITY UPDATE
    // ================================
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

    // ================================
    // 3️⃣ UPDATE DB
    // ================================
    const updatedRequest = await Request.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate("itemType", "name");

    const itemName =
      updatedRequest.itemType?.name || updatedRequest.itemName;

    // ================================
    // 4️⃣ NOTIFICATIONS (SMART)
    // ================================
    let message = "";

    if (status === "approved") {
      message = `Your request for ${itemName} was approved`;

      if (updatedRequest.approvedQuantity) {
        message += ` (Qty: ${updatedRequest.approvedQuantity})`;
      }
    }

    if (status === "rejected") {
      message = `Your request for ${itemName} was rejected`;
    }

    if (approvedQuantity !== undefined && !status) {
      message = `Approved quantity updated for ${itemName} (Qty: ${approvedQuantity})`;
    }

    if (message) {
      await Notification.create({
        user: updatedRequest.user,
        message,
        type: "status_updated",
        request: updatedRequest._id,
      });

      sendNotification(updatedRequest.user, {
        message,
        type: "status_updated",
        request: updatedRequest._id,
      });
    }

    // ================================
    // 5️⃣ RESPONSE
    // ================================
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