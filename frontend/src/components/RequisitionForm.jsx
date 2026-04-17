import { useState } from "react";
import API from "../services/api";

export default function RequisitionForm() {
  const [form, setForm] = useState({
    itemName: "",
    requiredDate: "",
    quantity: "",
    priority: "important",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.post("/requests", form);
      alert("Request submitted successfully");

      // reset form
      setForm({
        itemName: "",
        requiredDate: "",
        quantity: "",
        priority: "important",
      });

    } catch (error) {
      alert(error.response?.data?.message || "Error submitting request");
    }
  };

  return (
    <div>
      <h2>📦 Place Requisition</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="itemName"
          placeholder="Item Name"
          value={form.itemName}
          onChange={handleChange}
        />

        <input
          type="date"
          name="requiredDate"
          value={form.requiredDate}
          onChange={handleChange}
        />

        <input
          type="number"
          name="quantity"
          placeholder="Quantity"
          value={form.quantity}
          onChange={handleChange}
        />

        <select name="priority" value={form.priority} onChange={handleChange}>
          <option value="very_important">Very Important</option>
          <option value="important">Important</option>
          <option value="not_important">Not Important</option>
        </select>

        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
}