import User from "../models/User.js";

export const completeSetup = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};