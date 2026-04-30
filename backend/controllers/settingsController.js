import User from "../models/User.js";

export const completeSetup = async (req, res) => {
  try {
    console.log("🔥 Setup complete hit");

    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.inventorySetupComplete = true;
    await user.save();

    res.json({
      message: "Setup completed",
      user,
    });

  } catch (error) {
    console.error("❌ Setup error:", error);
    res.status(500).json({ message: "Server error" });
  }
};