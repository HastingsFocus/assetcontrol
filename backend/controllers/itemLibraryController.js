import ItemLibrary from "../models/ItemLibrary.js";

/**
 * ==============================
 * GET REUSABLE ITEMS (FOR DROPDOWN)
 * ==============================
 */
   export const getReusableItems =
async (req,res)=>{

try{

 const items =
 await ItemLibrary.find({

   user:req.user._id,

   $or:[

     {usageCount:{$gte:1}}, // NEW

     {isReusable:true},

     {isApproved:true}

   ]

 }).sort({

   updatedAt:-1

 });


 res.json(items);

}catch(err){

 console.log(err);

 res.status(500).json({

   message:
   "Failed to fetch"

 });

}

}

/**
 * ==============================
 * TRACK USAGE (CALL THIS WHEN ITEM IS USED IN REQUISITION)
 * ==============================
 */
export const trackItemUsage = async (req, res) => {
  try {
    const { name, itemType } = req.body;
    const userId = req.user._id;

    if (!name) {
      return res.status(400).json({ message: "Item name required" });
    }

    let item = await ItemLibrary.findOne({
      user: userId,
      name: name.trim(),
    });

    if (item) {
      item.usageCount += 1;

      if (item.usageCount >= 2) {
        item.isReusable = true;
      }

      await item.save();
    } else {
      item = await ItemLibrary.create({
        user: userId,
        name: name.trim(),
        itemType,
        usageCount: 1,
        isReusable: false,
        isApproved: false,
      });
    }

    res.json(item);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to track usage" });
  }
};

/**
 * ==============================
 * ADMIN: APPROVE ITEM
 * ==============================
 */
export const approveLibraryItem = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await ItemLibrary.findById(id);

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    item.isApproved = true;
    item.isReusable = true;

    await item.save();

    res.json({ message: "Item approved", item });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to approve item" });
  }
};