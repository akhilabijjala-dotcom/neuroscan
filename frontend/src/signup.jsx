
import { useState } from "react";

function Signup({ onSignup, onLogin }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [hospital, setHospital] = useState("");
  const [licenseId, setLicenseId] = useState("");
  const [role, setRole] = useState("Radiologist");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordStrong =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !name.trim() ||
      !email.trim() ||
      !hospital.trim() ||
      !licenseId.trim() ||
      !password ||
      !confirmPassword
    ) {
      setError("Please complete all fields.");
      return;
    }

    if (!passwordStrong) {
      setError(
        "Use at least 8 characters with uppercase, lowercase, a number and a symbol."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
          medical_license_id: licenseId.trim(),
          role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Registration failed. Please try again.");
        return;
      }

      alert("Account created successfully. Please sign in.");
      onSignup();
    } catch (err) {
      console.error("Signup error:", err);
      setError("Unable to connect. Please check that the server is running.");
    } finally {
      setLoading(false);
    }
  };

  
return (
  <div className="medical-auth-page">
    <main className="medical-auth-main signup-reference-main">
      <section className="medical-auth-card signup-reference-card">
        <div className="signup-reference-heading">
          <h1>NeuroScan Access - Create New Account</h1>
        </div>

        <form className="signup-reference-form" onSubmit={handleSubmit}>
          <input
            aria-label="Full professional name"
            type="text"
            placeholder="Full Professional Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="signup-reference-row">
            <input
              aria-label="Institutional email address"
              type="email"
              placeholder="Institutional Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="signup-reference-role">
              <label htmlFor="signup-role">Role</label>
              <select
                id="signup-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="Radiologist">Radiologist</option>
                <option value="Neurosurgeon">Neurosurgeon</option>
              </select>
            </div>
          </div>

          <input
            aria-label="Professional licence or registration number"
            type="text"
            placeholder="Professional License / Registration Number"
            value={licenseId}
            onChange={(e) => setLicenseId(e.target.value)}
            required
          />

          <label htmlFor="signup-password">Configure Password</label>
          <div className="signup-reference-password">
            <input
              id="signup-password"
              type={showPassword ? "text" : "password"}
              placeholder="Create a strong password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {password.length > 0 && (
            <p className={`signup-reference-strength ${passwordStrong ? "strong" : ""}`}>
              {passwordStrong
                ? "✓ Strong password"
                : "Use 8+ characters, uppercase, lowercase, number and symbol"}
            </p>
          )}

          <input
            aria-label="Confirm password"
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            required
          />

          {error && (
            <div className="medical-auth-error" role="alert">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="signup-reference-submit"
            disabled={loading}
          >
            {loading
              ? "Submitting..."
              : "➤  REGISTER AND SUBMIT ACCESS REQUEST"}
          </button>
        </form>

        <p className="signup-reference-login">
          Already have an approved account?{" "}
          <button type="button" onClick={onLogin}>
            Log In
          </button>
        </p>
      </section>

      <p className="medical-page-footer">
        NeuroScan · AI-assisted brain MRI analysis
      </p>
    </main>
  </div>
);

}

export default Signup;
