import ActivityLog from "../models/ActivityLog.js";

export const getAllLogs = async (req, res) => {
  try {

    const {
      page = 1,
      limit = 20,
      action,
      userId,
      role,
      department,
      startDate,
      endDate
    } = req.query;

    // =========================
    // BUILD FILTER OBJECT
    // =========================
    const filter = {};

    if (action) filter.action = action;
    if (userId) filter.userId = userId;
    if (role) filter.role = role;
    if (department) filter["metadata.department"] = department;

    // =========================
    // DATE FILTER
    // =========================
    if (startDate || endDate) {
      filter.createdAt = {};

      if (startDate) {
        filter.createdAt.$gte = new Date(startDate);
      }

      if (endDate) {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    // =========================
    // PAGINATION
    // =========================
    const skip = (page - 1) * limit;

    // =========================
    // FETCH LOGS
    // =========================
    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 }) // latest first
      .skip(skip)
      .limit(parseInt(limit));

    // =========================
    // TOTAL COUNT
    // =========================
    const total = await ActivityLog.countDocuments(filter);

    return res.json({
      logs,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error("❌ Get Logs Error:", error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

export const getLogsByAction = async (req, res) => {
  try {

    const logs = await ActivityLog.find({
      action: req.params.action
    }).sort({ createdAt: -1 });

    return res.json({ logs });

  } catch (error) {
    return res.status(500).json({
      message: "Server error"
    });
  }
};
export const getUserLogs = async (req, res) => {
  try {

    const logs = await ActivityLog.find({
      userId: req.params.id
    }).sort({ createdAt: -1 });

    return res.json({ logs });

  } catch (error) {
    return res.status(500).json({
      message: "Server error"
    });
  }
};