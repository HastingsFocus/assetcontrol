import Request from "../models/Request.js";
import User from "../models/User.js";
import Notification from "../models/Notification.js";
import ItemType from "../models/ItemType.js";
import { sendNotification, io } from "../socket.js";
import Item from "../models/Item.js";
import ItemLibrary from "../models/ItemLibrary.js";

// ===============================
// 🔥 FORMAT HELPER
// ===============================
const formatRequest = (request) => {
  const obj = request.toObject();

  return {
    ...obj,

    // 🔥 fallback request priority
    priority: obj.priority || "important",

    items: (obj.items || []).map((item) => {
      const populatedItemType =
        item.itemType && typeof item.itemType === "object"
          ? item.itemType
          : null;

      return {
        ...item,

        name:
          populatedItemType?.name ||
          item.customItemName ||
          "Unknown Item",

        itemType: populatedItemType?._id || item.itemType || null,

        type: item.itemType ? "predefined" : "custom",

        customItemName: item.customItemName || null,

        quantity: item.quantity,

        description: item.description || "",

        itemStatus: item.itemStatus || "pending",

        approvedQuantity: item.approvedQuantity || 0,
      };
    }),
  };
};

// ===============================
// 🔥 COMPUTE REQUEST STATUS
// ===============================
const computeRequestStatus = (items = []) => {
  const statuses = items.map((i) => i.itemStatus || "pending");

  if (statuses.length === 0) return "pending";

  if (statuses.every((s) => s === "approved")) {
    return "approved";
  }

  if (statuses.every((s) => s === "rejected")) {
    return "rejected";
  }

  if (statuses.every((s) => s === "pending")) {
    return "pending";
  }

  return "partially_approved";
};

// ===============================
// ✅ CREATE REQUEST
// ===============================
export const createRequest = async (req, res) => {
  try {
    const {
      requiredDate,
      items,
      remarks,
      priority,
    } = req.body;

    // ================= VALIDATION =================
    if (!requiredDate || !items || items.length === 0) {
      return res.status(400).json({
        message: "Required date and items are required",
      });
    }

    if (
      ![
        "very_important",
        "important",
        "not_important",
      ].includes(priority)
    ) {
      return res.status(400).json({
        message: "Invalid priority",
      });
    }

    const parsedDate = new Date(requiredDate);
    const today = new Date();

    today.setHours(0,0,0,0);
    parsedDate.setHours(0,0,0,0);

    if (Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({
        message:"Invalid date"
      });
    }

    if (parsedDate <= today) {
      return res.status(400).json({
        message:
          "Required date must be in future"
      });
    }

    const validatedItems = [];


    /*
    ==================================
    VALIDATE + TRACK ITEMS
    ==================================
    */

    for (const item of items) {

      const {
        itemType,
        customItemName,
        quantity,
        description,
      } = item;


      if (!quantity || quantity <= 0) {
        return res.status(400).json({
          message:
            "Quantity must be greater than 0",
        });
      }


      if (!itemType && !customItemName) {
        return res.status(400).json({
          message:
            "Each item must have type or custom name",
        });
      }


      /*
      ==================================
      PREDEFINED SYSTEM ITEM
      ==================================
      */

      if (itemType) {

        const type =
          await ItemType.findById(
            itemType
          );

        if (!type) {

          return res.status(404).json({
            message:
              "Item not found",
          });

        }


        if (
          !type.departments.includes(
            req.user.department
          )
        ) {

          return res.status(403).json({
            message:
              `${type.name} not allowed for your department`,
          });

        }


        validatedItems.push({

          itemType:
            type._id,

          customItemName:
            null,

          quantity,

          description:
            description || "",

          itemStatus:
            "pending",

          approvedQuantity:
            0,
        });
      }



      /*
      ==================================
      CUSTOM ITEM
      ==================================
      */

      else {

        validatedItems.push({

          itemType:
            null,

          customItemName,

          quantity,

          description:
            description || "",

          itemStatus:
            "pending",

          approvedQuantity:
            0,
        });


        /*
        ==================================
        TRACK ITEM LIBRARY
        ==================================
        */

        const name =
          customItemName.trim();


        let existing =
          await ItemLibrary.findOne({

            user:
              req.user._id,

            name:
              name,

          });



        // EXISTING ITEM
        if (existing) {

          existing.usageCount += 1;


          if (
            existing.usageCount >= 2
          ) {

            existing.isReusable =
              true;

          }


          await existing.save();
        }


        // FIRST TIME ITEM
        else {

          await ItemLibrary.create({

            user:
              req.user._id,

            name,

            itemType:
              null,

            usageCount:
              1,

            isReusable:
              false,

            isApproved:
              false,

          });

        }

      }

    }



    /*
    ==================================
    CREATE REQUEST
    ==================================
    */

    const request =
      await Request.create({

        user:
          req.user._id,

        department:
          req.user.department,

        requiredDate,

        priority,

        items:
          validatedItems,

        remarks:
          remarks || "",

        status:
          "pending",
      });



    /*
    ==================================
    ADMIN NOTIFICATIONS
    ==================================
    */

    const admins =
      await User.find({

        role:
          "admin",

      }).select("_id");


    const notifications =
      admins.map(admin => ({

        user:
          admin._id,

        message:
          `New requisition from ${req.user.department}`,

        type:
          "request_created",

        request:
          request._id,

        department:
          request.department,

      }));



    const saved =
      await Notification.insertMany(
        notifications
      );


    saved.forEach((n)=>{

      sendNotification(
        n.user.toString(),

        {
          _id:n._id,
          message:n.message,
          type:n.type,
          request:n.request,
          department:n.department,
        }

      );

    });



    return res.status(201).json({

      message:
        "Requisition submitted successfully",

      request:
        formatRequest(request),

    });

  }

  catch(err){

    console.error(err);

    res.status(500).json({

      message:
        "Server error",

    });

  }
};

// ===============================
// ✅ GET MY REQUESTS
// ===============================
export const getMyRequests = async (req, res) => {
  try {
    const requests = await Request.find({
      user: req.user._id,
    })
      .populate({
        path: "items.itemType",
        select: "name",
      })
      .sort({ createdAt: -1 });

    res.json(requests.map(formatRequest));

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// ✅ GET ALL REQUESTS
// ===============================
export const getAllRequests = async (req, res) => {
  try {
    const requests = await Request.find()
      .populate("user", "name email department")
      .populate({
        path: "items.itemType",
        select: "name",
      })
      .sort({ createdAt: -1 });

    const safe = requests.map((r) => ({
      ...formatRequest(r),

      user: r.user || {
        name: "Unknown",
        email: "Unknown",
        department: "Unknown",
      },
    }));

    res.json(safe);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      message: "Server error",
    });
  }
};

// ===============================
// ✅ UPDATE REQUEST STATUS
// ===============================
export const updateRequestStatus = async (req, res) => {
  try {
    const { items } = req.body;

    const request = await Request.findById(req.params.id)
      .populate("items.itemType", "name")
      .populate("user", "_id department");

    if (!request) {
      return res.status(404).json({
        message: "Request not found",
      });
    }

    // =====================================================
    // PROCESS ITEMS
    // =====================================================
    if (items && Array.isArray(items)) {

      for (const update of items) {

        const item = request.items.id(update._id);

        if (!item) continue;

        // =====================================================
        // PREVENT CHANGING APPROVED/REJECTED ITEMS
        // =====================================================
        if (
          item.itemStatus === "approved" ||
          item.itemStatus === "rejected"
        ) {
          continue;
        }

        // =====================================================
        // UPDATE STATUS
        // =====================================================
        if (update.itemStatus) {
          item.itemStatus = update.itemStatus;
        }

        // =====================================================
        // UPDATE APPROVED QUANTITY
        // =====================================================
        if (update.approvedQuantity !== undefined) {

          if (update.approvedQuantity < 0) {
            return res.status(400).json({
              message: "Invalid quantity",
            });
          }

          if (update.approvedQuantity > item.quantity) {
            return res.status(400).json({
              message: "Too many items approved",
            });
          }

          item.approvedQuantity =
            update.approvedQuantity;
        }

        // =====================================================
        // INVENTORY UPDATE
        // =====================================================
        if (update.itemStatus === "approved") {

          const qty =
            update.approvedQuantity || item.quantity;

          let inventory;

          // =====================================================
          // PREDEFINED ITEM
          // =====================================================
          if (item.itemType) {

            inventory = await Item.findOne({
              itemType: item.itemType._id,
              owner: request.user._id,
              department: request.user.department,
            });

            // CREATE PREDEFINED INVENTORY
            if (!inventory) {

              inventory = await Item.create({

                itemType: item.itemType._id,

                customItemName: "",

                department: request.user.department,

                owner: request.user._id,

                conditions: {
                  good: 0,
                  fair: 0,
                  poor: 0,
                },

                lastUpdated: new Date(),
              });

            }
          }

          // =====================================================
          // CUSTOM ITEM
          // =====================================================
          else {

            inventory = await Item.findOne({
              customItemName: item.customItemName,
              owner: request.user._id,
              department: request.user.department,
              itemType: null,
            });

            // CREATE CUSTOM INVENTORY
            if (!inventory) {

              inventory = await Item.create({

                itemType: null,

                customItemName:
                  item.customItemName || "Custom Item",

                department: request.user.department,

                owner: request.user._id,

                conditions: {
                  good: 0,
                  fair: 0,
                  poor: 0,
                },

                lastUpdated: new Date(),
              });

            }
          }

          // =====================================================
          // UPDATE STOCK
          // =====================================================
          inventory.conditions.good += qty;

          inventory.lastUpdated = new Date();

          await inventory.save();

          // =====================================================
          // SOCKET UPDATE
          // =====================================================
          io.emit("inventoryUpdated", {

            itemType:
              item.itemType?._id || null,

            customItemName:
              item.customItemName || null,

            department:
              request.user.department,
          });
        }
      }
    }

    // =====================================================
    // FINAL REQUEST STATUS
    // =====================================================
    request.status =
      computeRequestStatus(request.items);

    const updated = await request.save();

    // =====================================================
    // RETURN UPDATED REQUEST
    // =====================================================
    const populated = await Request.findById(updated._id)
      .populate("items.itemType", "name")
      .populate("user", "name email department");

    res.json({
      message: "Request updated",
      request: formatRequest(populated),
    });

  } catch (err) {

    console.error(
      "❌ updateRequestStatus error:",
      err
    );

    res.status(500).json({
      message: "Server error",
      error: err.message,
    });
  }
};