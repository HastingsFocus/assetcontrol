import mongoose from "mongoose";
import Item from "./models/Item.js";

await mongoose.connect("MONGO_URI");

const userId = "69eadb426615fa31ec0c7da4";

const items = await Item.find({ owner: userId });

console.log(items);

process.exit();