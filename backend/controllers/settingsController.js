import Settings from "../models/Settings.js";

// GET /api/settings/check-setup
export const checkSetup = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    // If no settings exist → create default
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json({
      isSetup: settings.isInventorySetup,
    });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// PUT /api/settings/setup-complete
export const completeSetup = async (req, res) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      settings = await Settings.create({ isInventorySetup: true });
    } else {
      settings.isInventorySetup = true;
      await settings.save();
    }

    res.json({ message: "Setup completed" });

  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};