import Request from "../models/Request.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import { sendNotification } from "../socket.js";

// ✅ CREATE REQUEST (HOD)
export const createRequest = async (req, res) => {
  try {
    const { itemName, requiredDate, quantity, priority } = req.body;

    // ✅ Validation
    if (!itemName || !requiredDate || !quantity || !priority) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    console.log("🔥 Creating request...");

    // ✅ Create request
    const request = await Request.create({
      user: req.user._id,
      itemName,
      requiredDate,
      quantity,
      priority,
      status: "pending",
    });

    // 🔥 FIND ADMINS
    const admins = await User.find({ role: "admin" });

    console.log("👥 Admins found:", admins.length);

    if (admins.length === 0) {
      console.log("⚠️ No admins found — no notifications will be sent");
    }

    // 🔥 NOTIFY ADMINS
    for (const admin of admins) {
      console.log("📢 Notifying admin:", admin._id);

      // 💾 Save notification (UPDATED 🔥)
      await Notification.create({
        user: admin._id,
        message: `New request for ${itemName}`,
        type: "request_created",
        request: request._id, // ✅ LINK TO REQUEST
      });

      // ⚡ Real-time notification
      sendNotification(admin._id, {
        message: `New request for ${itemName}`,
        type: "request_created",
        request: request._id, // ✅ send to frontend too
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

// ✅ GET MY REQUESTS (HOD)
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

// ✅ GET ALL REQUESTS (ADMIN)
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("user", "name email department")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    console.error("❌ getAllRequests error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ UPDATE STATUS (ADMIN)
export const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ✅ Validate status
    const validStatuses = ["pending", "approved", "rejected"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    // ✅ Find request
    const request = await Request.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    // ❌ Prevent duplicate update
    if (request.status === status) {
      return res.status(400).json({
        message: `Request is already ${status}`,
      });
    }

    console.log("🔄 Updating request status...");

    // ✅ Update status
    request.status = status;
    await request.save();

    // 🔥 NOTIFY USER
    const message =
      status === "approved"
        ? `Your request for ${request.itemName} was approved`
        : `Your request for ${request.itemName} was rejected`;

    console.log("📢 Notifying user:", request.user);

    // 💾 Save notification (UPDATED 🔥)
    await Notification.create({
      user: request.user,
      message,
      type: "status_updated",
      request: request._id, // ✅ LINK TO REQUEST
    });

    // ⚡ Real-time notification
    sendNotification(request.user, {
      message,
      type: "status_updated",
      request: request._id, // ✅ send to frontend
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