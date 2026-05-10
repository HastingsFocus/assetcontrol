import EditRequest from "../models/EditRequest.js";
import Item from "../models/Item.js";
import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendNotification } from "../socket.js";

// Returns the user's currently *active* (pending or approved) edit request, if any.
export const findActiveEditRequest = async (userId) => {
  return EditRequest.findOne({
    user: userId,
    status: { $in: ["pending", "approved"] },
  }).sort({ createdAt: -1 });
};

// HOD: request edit access for their own inventory.
export const createEditRequest = async (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({
        message: "Admins do not need edit access requests",
      });
    }

    const existing = await findActiveEditRequest(req.user._id);
    if (existing) {
      return res.status(400).json({
        message:
          existing.status === "pending"
            ? "You already have a pending edit request"
            : "Edit access is already approved",
        editRequest: existing,
      });
    }

    const editRequest = await EditRequest.create({
      user: req.user._id,
      department: req.user.department,
      reason: (req.body?.reason || "").toString().slice(0, 500),
    });

    // Notify all admins
    const admins = await User.find({ role: "admin" }).select("_id");

    const notificationsToInsert = admins.map((admin) => ({
      user: admin._id,
      message: `${req.user.name || "A user"} requested edit access for ${
        req.user.department || "their"
      } inventory`,
      type: "edit_access_requested",
      editRequest: editRequest._id,
      department: req.user.department,
      isRead: false,
    }));

    if (notificationsToInsert.length > 0) {
      const saved = await Notification.insertMany(notificationsToInsert);
      saved.forEach((n) => {
        sendNotification(n.user.toString(), {
          _id: n._id,
          user: n.user,
          message: n.message,
          type: n.type,
          editRequest: n.editRequest,
          department: n.department,
          isRead: false,
          createdAt: n.createdAt,
        });
      });
    }

    return res.status(201).json({
      message: "Edit access requested. Awaiting admin approval.",
      editRequest,
    });
  } catch (error) {
    console.error("❌ createEditRequest error:", error);
    return res.status(500).json({ message: "Failed to request edit access" });
  }
};

// HOD: get my latest active edit access (pending or approved), if any.
export const getMyEditAccess = async (req, res) => {
  try {
    const active = await findActiveEditRequest(req.user._id);
    return res.json({ editRequest: active || null });
  } catch (error) {
    console.error("❌ getMyEditAccess error:", error);
    return res.status(500).json({ message: "Failed to fetch edit access" });
  }
};

// HOD: mark approved edit access as completed (lock again).
export const completeEditAccess = async (req, res) => {
  try {
    const active = await findActiveEditRequest(req.user._id);
    if (!active || active.status !== "approved") {
      return res.status(400).json({
        message: "No active approved edit access to complete",
      });
    }

    active.status = "completed";
    await active.save();

    return res.json({
      message: "Edit access closed. Inventory is locked again.",
      editRequest: active,
    });
  } catch (error) {
    console.error("❌ completeEditAccess error:", error);
    return res.status(500).json({ message: "Failed to close edit access" });
  }
};

// ADMIN: list all edit requests (most recent first).
export const getAllEditRequests = async (req, res) => {
  try {
    const requests = await EditRequest.find()
      .populate("user", "name email department")
      .populate("decidedBy", "name email")
      .sort({ createdAt: -1 });

    return res.json(requests);
  } catch (error) {
    console.error("❌ getAllEditRequests error:", error);
    return res.status(500).json({ message: "Failed to fetch edit requests" });
  }
};

// ADMIN: approve or reject a pending edit request.
export const decideEditRequest = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const editRequest = await EditRequest.findById(req.params.id).populate(
      "user",
      "_id name department"
    );

    if (!editRequest) {
      return res.status(404).json({ message: "Edit request not found" });
    }

    if (editRequest.status !== "pending") {
      return res.status(400).json({
        message: `Cannot change status from ${editRequest.status}`,
      });
    }

    editRequest.status = status;
    editRequest.decidedBy = req.user._id;
    editRequest.decidedAt = new Date();
    await editRequest.save();

    // Notify the requesting user
    const message =
      status === "approved"
        ? "Your inventory edit request was approved. You can now edit your inventory."
        : "Your inventory edit request was rejected.";

    const notification = await Notification.create({
      user: editRequest.user._id,
      message,
      type: "edit_access_decided",
      editRequest: editRequest._id,
      department: editRequest.department,
      isRead: false,
    });

    sendNotification(editRequest.user._id.toString(), {
      _id: notification._id,
      user: notification.user,
      message: notification.message,
      type: notification.type,
      editRequest: notification.editRequest,
      department: notification.department,
      isRead: false,
      createdAt: notification.createdAt,
    });

    return res.json({
      message: `Edit request ${status}`,
      editRequest,
    });
  } catch (error) {
    console.error("❌ decideEditRequest error:", error);
    return res.status(500).json({ message: "Failed to update edit request" });
  }
};

// Helper used by item routes: ensures the user is allowed to mutate inventory.
// First-time setup (no items yet) is allowed without approval. After that,
// the user must have an active *approved* edit request.
export const ensureCanEditInventory = async (userId) => {
  const hasItems = await Item.exists({ owner: userId });
  if (!hasItems) {
    return { allowed: true, reason: "first-setup" };
  }

  const active = await findActiveEditRequest(userId);
  if (active && active.status === "approved") {
    return { allowed: true, reason: "approved", editRequest: active };
  }

  return {
    allowed: false,
    reason: active?.status === "pending" ? "pending" : "locked",
  };
};
