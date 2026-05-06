import { useEffect, useState, useCallback } from "react";
import API from "../services/api";
import socket from "../socket";

export default function InventoryOverview() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================
  // FETCH INVENTORY
  // =========================
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await API.get("/items/all");
      setData(res.data || []);
      setError("");
    } catch (err) {
      console.error("❌ Failed to fetch inventory", err);
      if (err.response?.status === 403) {
        setError("Access denied. Please login again as admin.");
      } else {
        setError("Failed to load inventory");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    fetchInventory();

    const handleUpdate = () => {
      if (isMounted) fetchInventory();
    };

    socket.on("inventoryUpdated", handleUpdate);
    return () => {
      isMounted = false;
      socket.off("inventoryUpdated", handleUpdate);
    };
  }, [fetchInventory]);

  // =========================
  // GROUP BY DEPARTMENT
  // =========================
  const grouped = data.reduce((acc, item) => {
    const dept = item.department || "Unknown";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(item);
    return acc;
  }, {});

  const totalItems = data.length;
  const totalGood = data.reduce((s, i) => s + (i.conditions?.good || 0), 0);
  const totalFair = data.reduce((s, i) => s + (i.conditions?.fair || 0), 0);
  const totalPoor = data.reduce((s, i) => s + (i.conditions?.poor || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-sm">
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-500 font-medium">No inventory data available</p>
      </div>
    );
  }

  return (
    <div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Items", value: totalItems, textColor: "text-slate-700", bg: "bg-slate-100" },
          { label: "Good Condition", value: totalGood, textColor: "text-green-700", bg: "bg-green-50" },
          { label: "Fair Condition", value: totalFair, textColor: "text-blue-700", bg: "bg-blue-50" },
          { label: "Poor Condition", value: totalPoor, textColor: "text-red-700", bg: "bg-red-50" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-2xl p-5 border border-zinc-100/90 shadow-sm text-center`}>
            <p className="text-sm text-zinc-500 font-medium mb-1">{stat.label}</p>
            <p className={`text-3xl font-bold ${stat.textColor}`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Department Cards */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([dept, items]) => (
          <div key={dept} className="bg-white rounded-2xl shadow-md shadow-zinc-900/6 border border-zinc-200/90 overflow-hidden ring-1 ring-zinc-100">

            {/* Dept Header */}
            <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50/90 border-b border-zinc-200/80">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-500 shadow-sm shadow-slate-600/35"></div>
                <h3 className="font-semibold tracking-tight text-zinc-900">{dept}</h3>
              </div>
              <span className="text-xs text-blue-800 bg-blue-100 px-2.5 py-1 rounded-full font-semibold ring-1 ring-blue-200">
                {items.length} item{items.length !== 1 ? "s" : ""}
              </span>
            </div>

            {/* Items Table */}
            <table className="w-full table-fixed text-sm">
              <colgroup>
                <col className="w-[40%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-zinc-100">
                  <th className="text-center px-5 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wide">Item</th>
                  <th className="text-center px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wide">Good</th>
                  <th className="text-center px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wide">Fair</th>
                  <th className="text-center px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wide">Poor</th>
                  <th className="text-center px-4 py-2.5 text-zinc-500 font-medium text-xs uppercase tracking-wide">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {items.map((item) => {
                  const total = (item.conditions?.good || 0) + (item.conditions?.fair || 0) + (item.conditions?.poor || 0);
                  return (
                    <tr key={item._id} className="h-12 hover:bg-zinc-50 transition-colors">
                      <td className="px-5 py-3 text-center font-semibold text-zinc-800 truncate">
                        {item.itemType?.name || "Unknown Item"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-green-700 font-semibold tabular-nums">{item.conditions?.good || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-blue-700 font-semibold tabular-nums">{item.conditions?.fair || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-red-600 font-semibold tabular-nums">{item.conditions?.poor || 0}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-zinc-900 font-bold tabular-nums">{total}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </div>
  );
}
