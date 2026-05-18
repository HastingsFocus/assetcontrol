import { useEffect, useState } from "react";
import API from "../../../services/api";

export default function AdminDashboard() {

  const [stats, setStats] = useState({
    users: 0,
    requests: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  const [loading, setLoading] = useState(false);

  // =========================
  // FETCH DASHBOARD STATS
  // =========================
  const fetchStats = async () => {
    try {
      setLoading(true);

      const res = await API.get("/admin/stats");

      setStats(res.data);

    } catch (err) {
      console.log("Dashboard error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // =========================
  // UI CARD COMPONENT
  // =========================
  const Card = ({ title, value, color }) => (
    <div className={`p-4 rounded-lg shadow text-white ${color}`}>
      <h3 className="text-sm opacity-80">{title}</h3>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );

  return (
    <div className="p-6">

      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-6">
        Admin Dashboard 👑
      </h1>

      {loading ? (
        <p>Loading stats...</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">

          <Card
            title="Total Users"
            value={stats.users}
            color="bg-blue-500"
          />

          <Card
            title="Total Requests"
            value={stats.requests}
            color="bg-purple-500"
          />

          <Card
            title="Pending"
            value={stats.pending}
            color="bg-yellow-500"
          />

          <Card
            title="Approved"
            value={stats.approved}
            color="bg-green-500"
          />

          <Card
            title="Rejected"
            value={stats.rejected}
            color="bg-red-500"
          />

        </div>
      )}

      {/* QUICK NAVIGATION */}
      <div className="mt-8">

        <h2 className="text-lg font-semibold mb-3">
          Quick Actions ⚡
        </h2>

        <div className="flex gap-3 flex-wrap">

          <a
            href="/admin/users"
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            Manage Users
          </a>

          <a
            href="/admin/requests"
            className="px-4 py-2 bg-purple-600 text-white rounded"
          >
            View Requests
          </a>

          <a
            href="/admin/logs"
            className="px-4 py-2 bg-black text-white rounded"
          >
            Activity Logs
          </a>

        </div>

      </div>

    </div>
  );
}