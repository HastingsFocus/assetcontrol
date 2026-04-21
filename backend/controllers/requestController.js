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
    const { status } = req.body;

    const validStatuses = ["pending", "approved", "rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status",
      });
    }

    const request = await Request.findById(req.params.id)
      .populate("itemType", "name");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    if (request.status === status) {
      return res.status(400).json({
        message: `Request is already ${status}`,
      });
    }

    console.log("🔄 Updating request status...");

    request.status = status;
    await request.save();

    const message =
      status === "approved"
        ? `Your request for ${request.itemType.name} was approved`
        : `Your request for ${request.itemType.name} was rejected`;

    console.log("📢 Notifying user:", request.user);

    await Notification.create({
      user: request.user,
      message,
      type: "status_updated",
      request: request._id,
    });

    sendNotification(request.user, {
      message,
      type: "status_updated",
      request: request._id,
    });

    res.json({
      message: "Request updated successfully",
      request,
    });

  } catch (error) {
    console.error("❌ updateRequestStatus error:", error);
    res.status(500).json({
      message: error.message || "Server error",
    });
  }
};