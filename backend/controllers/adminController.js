import User from "../models/User.js";
import { auditLogger } from "../middleware/auditLogger.js";
import { logAction } from "../services/activityService.js";

/**
 * 👥 GET ALL USERS
 * Super admin can view every registered user
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Get Users Error:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * ❌ DELETE USER
 * Super admin permanently removes a user
 */
export const deleteUser = async (req, res) => {
  try {

    const { id } = req.params;

    // =========================
    // FIND USER FIRST
    // =========================
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    // =========================
    // STORE USER DATA FOR LOGGING
    // =========================
    const deletedUserData = {
      email: user.email,
      role: user.role,
      department: user.department,
    };

    // =========================
    // DELETE USER
    // =========================
    await User.findByIdAndDelete(id);

    // =========================
    // 📜 AUDIT LOG
    // =========================
    await logAction(
      req,
      "USER_DELETED",
      null,
      id,
      {
        deletedUser: deletedUserData,
        deletedBy: req.user.email,
      }
    );

    return res.json({
      message: "User deleted successfully",
    });

  } catch (error) {

    console.error("❌ Delete User Error:", error);

    return res.status(500).json({
      message: "Server error",
    });

  }
};

/**
 * 📊 SYSTEM OVERVIEW (optional but powerful)
 */
export const getSystemStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const admins = await User.countDocuments({ role: "admin" });
    const hods = await User.countDocuments({ role: "hod" });

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        admins,
        hods,
      },
    });
  } catch (error) {
    console.error("Stats Error:", error.message);
    res.status(500).json({ message: "Failed to load system stats" });
  }
};