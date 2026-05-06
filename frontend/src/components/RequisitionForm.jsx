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
  const minFutureDate = (() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split("T")[0];
  })();

  // =========================
  // FETCH ITEM TYPES
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
    if (user) fetchItemTypes();
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // =========================
  // SUBMIT
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.itemType) { toast.error("Please select an item"); return; }
    if (!form.requiredDate) { toast.error("Please select required date"); return; }
    if (!form.quantity || Number(form.quantity) <= 0) { toast.error("Enter valid quantity"); return; }
    const selectedDate = new Date(`${form.requiredDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      toast.error("Required date must be a future date");
      return;
    }

    try {
      setLoading(true);
      const res = await API.post("/requests", {
        ...form,
        quantity: Number(form.quantity),
      });

      toast.success("Request submitted successfully");
      setForm({ itemType: "", requiredDate: "", quantity: "", priority: "important" });
      console.log("✅ Request:", res.data);

    } catch (error) {
      if (error.response?.data?.setupRequired) {
        toast.error("Please setup inventory first");
        navigate("/setup-inventory");
        return;
      }
      toast.error(error.response?.data?.message || "Error submitting request");
    } finally {
      setLoading(false);
    }
  };

  const priorityOptions = [
    { value: "very_important", label: "Very Important", color: "text-red-600" },
    { value: "important", label: "Important", color: "text-amber-600" },
    { value: "not_important", label: "Not Important", color: "text-zinc-500" },
  ];

  return (
    <div className="w-full max-w-xl">
      <div className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 overflow-hidden ring-1 ring-zinc-100">

        {/* Card Header */}
        <div className="bg-gradient-to-r from-slate-700 via-slate-700 to-slate-600 px-6 py-4 border-b border-slate-500/30">
          <h2 className="text-white font-semibold text-lg tracking-tight">New Requisition</h2>
          <p className="text-slate-100/90 text-sm mt-0.5">
            Submit a request for items needed by your department
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-5 bg-white">

          {/* Item Type */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Item Required <span className="text-red-500">*</span>
            </label>
            <select
              name="itemType"
              value={form.itemType}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500/60 transition"
            >
              <option value="">Select an item...</option>
              {itemTypes.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Quantity <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="quantity"
              placeholder="Enter quantity needed"
              value={form.quantity}
              onChange={handleChange}
              min="1"
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500/60 transition"
            />
          </div>

          {/* Required Date */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Date Required <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="requiredDate"
              value={form.requiredDate}
              onChange={handleChange}
              min={minFutureDate}
              className="w-full px-4 py-2.5 border border-zinc-200 rounded-lg text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/25 focus:border-slate-500/60 transition"
            />
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1.5">
              Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {priorityOptions.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 cursor-pointer text-sm font-medium transition-all ${
                    form.priority === opt.value
                      ? "border-slate-500 bg-slate-50/95 text-slate-900 ring-1 ring-slate-500/25"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 shadow-sm"
                  }`}
                >
                  <input
                    type="radio"
                    name="priority"
                    value={opt.value}
                    checked={form.priority === opt.value}
                    onChange={handleChange}
                    className="hidden"
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-slate-700 to-slate-600 hover:from-slate-600 hover:to-slate-500 disabled:opacity-60 text-white font-semibold py-3 rounded-lg shadow-lg shadow-slate-900/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Submit Request
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
