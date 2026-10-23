import { useState } from "react";

function Login({ onLogin, onSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotMessage, setForgotMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your hospital email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.detail || "Invalid email or password.");
        return;
      }

      sessionStorage.setItem("neuroscan_token", data.access_token);
      sessionStorage.setItem("neuroscan_user", JSON.stringify(data.user));
      console.log("Logged-in user:", data.user);

      onLogin();
    } catch (err) {
      console.error("Login error:", err);
      setError("Cannot connect to the server. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
const handleForgotPassword = async (e) => {
  e.preventDefault();
  setForgotMessage("");
  setError("");

  if (!email.trim()) {
    setError("Please enter your registered email first.");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || "Could not request a password reset.");
    }

    if (data.reset_link) {
      setForgotMessage(
        "Reset link created. For now, open the link returned by the API response in Swagger."
      );
    } else {
      setForgotMessage(
        "If that email is registered, a password reset link can be requested."
      );
    }
  } catch (err) {
    setError(err.message || "Cannot connect to the server.");
  }
};


  return (
    <div className="medical-auth-page">
      <main className="medical-auth-main">
        <section className="medical-auth-card">
          <div className="medical-auth-brand">
            <div className="medical-brain-logo" aria-hidden="true">
              <span>🧠</span>
              <span className="medical-shield">✓</span>
            </div>
            <p className="medical-brand-name">NeuroScan</p>
            <p className="medical-brand-caption">
              AI-ASSISTED BRAIN MRI ANALYSIS
            </p>
            <h1>Welcome to NeuroScan AI</h1>
            <p className="medical-brand-description">
              Secure access to your diagnostic workspace
            </p>
          </div>

          <div className="medical-auth-tabs">
            <button
              type="button"
              className="medical-auth-tab active"
              aria-current="page"
            >
              Login
            </button>
            <button
              type="button"
              className="medical-auth-tab"
              onClick={onSignup}
            >
              Create Account
            </button>
          </div>

          <div className="medical-auth-content">
            <h2>Sign in to your account</h2>
            <p className="medical-form-description">
              Use your registered professional email to continue.
            </p>

            <form onSubmit={handleSubmit}>
              <label htmlFor="medical-login-email">
                Hospital Email / Username
              </label>
              <input
                id="medical-login-email"
                type="email"
                placeholder="Enter your professional email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                required
              />

              <label htmlFor="medical-login-password">
                Password
              </label>
              <div className="medical-password-field">
                <input
                  id="medical-login-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="medical-password-toggle"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>

            


              {error && (
                <div className="medical-auth-error" role="alert">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="medical-submit-button"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in securely →"}
              </button>
            </form>

            <div className="medical-forgot-row">
  <button
    type="button"
    className="medical-link"
    onClick={() => {
      setShowForgotPassword((current) => !current);
      setForgotMessage("");
      setError("");
    }}
  >
    {showForgotPassword ? "Back to login" : "Forgot password?"}
  </button>
</div>

{showForgotPassword && (
  <div>
    <p>Enter your registered email to request a password reset.</p>

    <form onSubmit={handleForgotPassword}>
      <label htmlFor="forgot-password-email">
        Registered email
      </label>
      <input
        id="forgot-password-email"
        type="email"
        placeholder="Enter your professional email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <button
        type="submit"
        className="medical-submit-button"
      >
        Send reset request
      </button>
    </form>
  
    {forgotMessage && (
      <p role="status">{forgotMessage}</p>
    )}
  </div>
)}


            <p className="medical-register-prompt">
              Don't have an account?{" "}
              <button
                type="button"
                className="medical-link"
                onClick={onSignup}
              >
                Register here
              </button>
            </p>
          </div>

          <div className="medical-security-footer">
            <span aria-hidden="true">🔒</span>
            <p>
              Authorized access only. Keep your password private.
            </p>
          </div>
        </section>

        <p className="medical-page-footer">
          NeuroScan · AI-assisted brain MRI analysis
        </p>
        <p className="medical-disclaimer">
          AI predictions are decision-support information and require
          professional clinical review.
        </p>
      </main>
    </div>
  );
}

export default Login;
