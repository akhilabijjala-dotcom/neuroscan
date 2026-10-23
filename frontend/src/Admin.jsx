import "./App.css";
import { useEffect, useState } from "react";

const API = "http://127.0.0.1:8000";

export default function Admin() {
  const [users, setUsers] = useState([]);
  const token = localStorage.getItem("neuroscan_token") ||
    sessionStorage.getItem("neuroscan_token");

  async function loadUsers() {
    const res = await fetch(`${API}/admin/pending-users`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) setUsers(await res.json());
    else alert("Could not load users. Check admin login.");
  }

  async function approveUser(id) {
    const res = await fetch(`${API}/admin/users/${id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` }
    });
    if (res.ok) {
      alert("User approved!");
      loadUsers();
    } else {
      alert("Approval failed.");
    }
  }


async function rejectUser(id) {
  if (!window.confirm("Reject this user?")) return;

  const res = await fetch(`${API}/admin/users/${id}/reject`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` }
  });

  if (res.ok) {
    alert("User rejected.");
    loadUsers();
  } else {
    alert("Rejection failed.");
  }
}


  useEffect(() => {
    loadUsers();
  }, []);

 
return (
  <div className="admin-page">
    <h1>Admin Approvals</h1>
    <p className="admin-subtitle">
      Review and manage medical staff registrations.
    </p>

    <section className="admin-section">
      <h2>Pending User Approvals ({users.length})</h2>

      {users.length === 0 ? (
        <p className="admin-empty">No pending users.</p>
      ) : (
        users.map((user) => (
          <div className="admin-user" key={user.id}>
            <div className="admin-user-info">
              <h3>{user.name}</h3>
              <p>{user.email}</p>
              <p>Role: {user.role}</p>
              <p>
                License: {user.medical_license_id || "Not provided"}
              </p>
            </div>

            <div className="admin-actions">
              <button
                className="admin-approve"
                onClick={() => approveUser(user.id)}
              >
                Approve
              </button>

              <button
                className="admin-reject"
                onClick={() => rejectUser(user.id)}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </section>
  </div>
);
}