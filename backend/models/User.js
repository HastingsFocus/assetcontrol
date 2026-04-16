import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { 
      type: String, 
      required: true, 
      trim: true 
    },
    email: { 
      type: String, 
      required: true, 
      unique: true 
    },
    password: { 
      type: String, 
      required: true 
    },
    role: { 
      type: String, 
      enum: ["admin", "hod"], 
      required: true 
    },
    department: { 
      type: String 
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);