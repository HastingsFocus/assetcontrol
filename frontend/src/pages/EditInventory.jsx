import { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function EditInventory() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    department: "",
    location: "",
  });

  // 🔥 LOAD EXISTING INVENTORY (setup data)
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await API.get("/items/setup"); 
        setForm(res.data);
      } catch (err) {
        console.log("Error loading inventory", err);
      }
    };

    fetchInventory();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 🔥 UPDATE INVENTORY
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await API.put("/items/setup", form); // update existing setup

      alert("Inventory updated successfully");

      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      alert("Update failed");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>✏️ Edit Inventory Setup</h2>

      <form onSubmit={handleSubmit}>
        <input
          name="name"
          placeholder="Inventory Name"
          value={form.name}
          onChange={handleChange}
        />

        <input
          name="department"
          placeholder="Department"
          value={form.department}
          onChange={handleChange}
        />

        <input
          name="location"
          placeholder="Location"
          value={form.location}
          onChange={handleChange}
        />

        <button type="submit">Save Changes</button>
      </form>
    </div>
  );
}