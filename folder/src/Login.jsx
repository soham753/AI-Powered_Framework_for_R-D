import React, { useState, useContext, useEffect } from "react";
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "./context/UserContext.jsx";
const LoginPage = () => {
  const { user, setUser } = useContext(UserContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      setUser({
        id: userId,
        name: localStorage.getItem("userName"),
        profile_image: localStorage.getItem("profileImage") || "",})
      navigate(`/${userId}/ProjectDashboard`);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/login/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (response.ok) {
        try {
          localStorage.setItem("userId", result.user.id);
          localStorage.setItem("userName", result.user.name);
          localStorage.setItem("profileImage", result.user.profile_image || "");
          setUser(result.user);
        } catch (err) {
          console.error(" Failed to save to localStorage:", err);
        }

        navigate(`/${result.user.id}/ProjectDashboard`);
      } else {
        setErrorMessage(result.error || "Login failed. Try again.");
      }
    } catch (err) {
      setErrorMessage("Server error. Please try again.");
    }

    setIsSubmitting(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-box">
          <div className="login-header">
            <h2>Welcome Back</h2>
            <p>Please enter your credentials to login</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>

            <div className="form-options">
              <a href="#forgot" className="forgot-password">
                Forgot password?
              </a>
            </div>

            {errorMessage && (
              <div className="error-message-box">{errorMessage}</div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="login-footer">
            <p>
              Don't have an account?{" "}
              <Link to="/register" className="create-account">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
