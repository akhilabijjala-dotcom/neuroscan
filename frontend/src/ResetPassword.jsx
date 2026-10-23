
import { useState } from "react";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleReset = async (e) => {
    e.preventDefault();
    setMessage("");

    if (!token) {
      setMessage("Reset token is missing. Please request a new link.");
      return;
    }

    if (password.length < 12) {
      setMessage("Password must be at least 12 characters long.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          new_password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Password reset failed.");
      }

      setMessage("Password reset successfully! You can now log in.");
      setPassword("");
    } catch (error) {
      setMessage(error.message || "Could not connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Reset Password</h2>
      <p>Enter your new password below.</p>

      <form onSubmit={handleReset}>
        <label htmlFor="new-password">New password</label>
        <input
          id="new-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={12}
          autoComplete="new-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
    </div>
  );
}

export default ResetPassword;
