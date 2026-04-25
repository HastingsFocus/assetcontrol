import { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

export default function RequisitionForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    itemType: "",
    requiredDate: "",
    quantity: "",
    priority: "important",
  });

  // =========================
  // 🔥 FETCH ITEM TYPES
  // =========================
  useEffect(() => {
    const fetchItemTypes = async () => {
      try {
        const res = await API.get("/items/types");

        setItemTypes(res.data);
      } catch (err) {
        console.log(err);
        toast.error("Failed to load items");
      }
    };

    if (user) {
      fetchItemTypes();
    }
  }, [user]);

  // =========================
  // 🔄 HANDLE CHANGE
  // =========================
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // =========================
  // 🚀 SUBMIT REQUEST (🔥 UPDATED FLOW)
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // 🔒 VALIDATION
    if (!form.itemType) {
      toast.error("Please select an item");
      return;
    }

    if (!form.requiredDate) {
      toast.error("Please select required date");
      return;
    }

    if (!form.quantity || Number(form.quantity) <= 0) {
      toast.error("Enter valid quantity");
      return;
    }

    try {
      setLoading(true);

      // 🚀 SEND REQUEST (BACKEND DECIDES EVERYTHING)
      const res = await API.post("/requests", {
        ...form,
        quantity: Number(form.quantity),
      });

      toast.success("Request submitted successfully 🚀");

      // 🔄 RESET FORM
      setForm({
        itemType: "",
        requiredDate: "",
        quantity: "",
        priority: "important",
      });

      console.log("✅ Request:", res.data);

    } catch (error) {
      console.log("❌ ERROR:", error);

      // 🔥 SETUP ENFORCEMENT HANDLING (IMPORTANT FIX)
      if (error.response?.data?.setupRequired) {
        toast.error("Please setup inventory first");

        navigate("/setup-inventory");
        return;
      }

      toast.error(
        error.response?.data?.message ||
          "Error submitting request"
      );

    } finally {
      setLoading(false);
    }
  };

  // =========================
  // 🎨 UI
  // =========================
  return (
    <div style={{ maxWidth: "400px", margin: "auto" }}>
      <h2>📦 Place Requisition</h2>

      <form onSubmit={handleSubmit}>
        {/* ITEM */}
        <select
          name="itemType"
          value={form.itemType}
          onChange={handleChange}
        >
          <option value="">Select Item</option>

          {itemTypes.map((item) => (
            <option key={item._id} value={item._id}>
              {item.name}
            </option>
          ))}
        </select>

        <br /><br />

        {/* DATE */}
        <input
          type="date"
          name="requiredDate"
          value={form.requiredDate}
          onChange={handleChange}
        />

        <br /><br />

        {/* QUANTITY */}
        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
        />

        <br /><br />

        {/* PRIORITY */}
        <select
          name="priority"
          value={form.priority}
          onChange={handleChange}
        >
          <option value="very_important">Very Important</option>
          <option value="important">Important</option>
          <option value="not_important">Not Important</option>
        </select>

        <br /><br />

        {/* SUBMIT */}
        <button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Request"}
        </button>
      </form>
    </div>
  );
}