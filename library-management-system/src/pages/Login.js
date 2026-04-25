import { useState } from "react";
import { supabase } from "../services/supabaseClient";
import { useNavigate, useLocation } from "react-router-dom";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const selectedRole = params.get("role");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Enter email & password");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error || !data.user) {
      alert("Login failed");
      setLoading(false);
      return;
    }

    const user = data.user;

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData) {
      alert("User data not found");
      setLoading(false);
      return;
    }

    if (selectedRole && userData.role !== selectedRole) {
      alert("Wrong role selected");
      setLoading(false);
      return;
    }

    if (userData.role === "super_admin") navigate("/super-admin");
    else if (userData.role === "admin") navigate("/admin");
    else navigate("/student");

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <p className="role-text">
          Role: <strong>{selectedRole}</strong>
        </p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button onClick={handleLogin}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p>
          Don't have an account?{" "}
          <span
            onClick={() => navigate("/signup")}
            style={{ color: "#f9f9f9", fontWeight: "bold", cursor: "pointer" }}
          >
            Signup
          </span>
        </p>
      </div>
    </div>
  );
}

export default Login;