import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useNavigate } from "react-router-dom";

// baca dari .env
const DEV_MODE = import.meta.env.VITE_DEV_MODE === "true";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (DEV_MODE) {
      // Auto login fake user terus
      setTimeout(() => {
        alert("Dev mode: Auto login sebagai dev@test.com");
        navigate("/dashboard");
      }, 500);
    }
  }, []);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      navigate("/dashboard");
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      setError(error.message);
    } else {
      alert("Check email untuk confirm akaun!");
    }
  }

  if (DEV_MODE) {
    return (
      <section className="section">
        <div className="container max-w-md card text-center">
          <h1 className="h1 mb-4">Login (Dev Mode)</h1>
          <p className="p-muted">Auto login sebagai <b>dev@test.com</b></p>
          <p className="text-green-600 mt-2">Redirecting ke Dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container max-w-md card">
        <h1 className="h1 mb-6">Login / Register</h1>
        <form className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full border rounded-xl p-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full border rounded-xl p-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <div className="flex gap-3">
            <button onClick={handleLogin} className="btn btn-primary flex-1">
              Login
            </button>
            <button
              onClick={handleRegister}
              className="btn btn-outline flex-1"
            >
              Register
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
