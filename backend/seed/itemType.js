import dotenv from "dotenv";
import mongoose from "mongoose";
import ItemType from "../models/ItemType.js";

dotenv.config();

// 🔥 connect to MongoDB Atlas
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected for seeding"))
  .catch(err => {
    console.error("❌ DB connection error:", err);
    process.exit(1);
  });

const seed = async () => {
  try {
    await ItemType.deleteMany();

    await ItemType.insertMany([
      { name: "Desktop Computer", departments: ["ICT", "Accounts", "Library"] },
      { name: "Laptop", departments: ["ICT", "Accounts", "Public Health", "SRC"] },
      { name: "Mouse", departments: ["ICT"] },
      { name: "Keyboard", departments: ["ICT"] },
      { name: "Router", departments: ["ICT"] },
      { name: "Switch", departments: ["ICT"] },
      { name: "Network Cable", departments: ["ICT"] },
      { name: "Printer", departments: ["ICT", "Library", "Accounts", "Public Health"] },
      { name: "UPS", departments: ["ICT"] },

      { name: "Scanner", departments: ["Library"] },
      { name: "Bookshelf", departments: ["Library"] },
      { name: "Chairs", departments: ["Library", "SRC", "Social Welfare"] },
      { name: "Tables", departments: ["Library", "SRC", "Social Welfare"] },

      { name: "Hospital Beds", departments: ["Nursing"] },
      { name: "BP Machines", departments: ["Nursing"] },
      { name: "Thermometers", departments: ["Nursing"] },
      { name: "Wheelchairs", departments: ["Nursing"] },
      { name: "IV Stands", departments: ["Nursing"] },
      { name: "Gloves", departments: ["Nursing"] },

      { name: "Medicine Cabinets", departments: ["Pharmacy"] },
      { name: "Refrigerators", departments: ["Pharmacy", "Kitchen"] },
      { name: "Shelves", departments: ["Pharmacy"] },

      { name: "Projectors", departments: ["Public Health", "SRC"] },
      { name: "Vehicles", departments: ["Public Health"] },
      { name: "Tablets", departments: ["Public Health"] },

      { name: "Tool Kits", departments: ["Maintenance"] },
      { name: "Generators", departments: ["Maintenance"] },
      { name: "Ladders", departments: ["Maintenance"] },
      { name: "Drilling Machines", departments: ["Maintenance"] },
      { name: "Electrical Tools", departments: ["Maintenance"] },

      { name: "Calculator", departments: ["Accounts"] },
      { name: "Filing Cabinets", departments: ["Accounts", "Social Welfare"] },

      { name: "Cooking Pots", departments: ["Kitchen"] },
      { name: "Gas Burners", departments: ["Kitchen"] },
      { name: "Freezers", departments: ["Kitchen"] },
      { name: "Utensils", departments: ["Kitchen"] }
    ]);

    console.log("🔥 Item types seeded successfully");

    process.exit(); // stop script
  } catch (error) {
    console.error("❌ Seeding error:", error);
    process.exit(1);
  }
};

seed();