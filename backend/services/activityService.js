import ActivityLog from "../models/ActivityLog.js";

export const logAction = async (
  req,
  action,
  user = null,
  targetId = null,
  metadata = {}
) => {
  try {
    const actor = user || req.user;

    if (!actor) return;

    await ActivityLog.create({
      userId: actor._id || actor.id,
      email: actor.email,
      role: actor.role,

      action,
      targetId,
      metadata,

      ipAddress: req.ip,
      userAgent: req.headers["user-agent"],
    });
  } catch (error) {
    console.error("❌ Activity log failed:", error.message);
  }
};