import ActivityLog from "../models/ActivityLog.js";

export const auditLogger = (req, res, next) => {
  req.auditLog = async ({ action, targetId = null, metadata = {} }) => {
    try {
      if (!req.user) return;

      await ActivityLog.create({
        userId: req.user._id,
        email: req.user.email,
        role: req.user.role,
        action,
        targetId,
        metadata,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
      });
    } catch (error) {
      console.error("Audit Log Error:", error.message);
    }
  };

  next();
};