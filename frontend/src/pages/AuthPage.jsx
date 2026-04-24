import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabaseClient";

export default function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const action = isLogin
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({ email, password });

    const { error } = await action;
    if (error) setMessage(error.message);
    else {
      setMessage(isLogin ? "Login successful." : "Signup successful. Check email if confirmation is enabled.");
      navigate("/");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto mt-20 w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900/70 p-8">
      <h1 className="mb-2 text-2xl font-bold text-cyan-300">BodyWise AI</h1>
      <p className="mb-6 text-sm text-slate-300">Personal Body & Skin Intelligence Platform</p>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <input className="w-full rounded-lg bg-slate-800 p-3" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded-lg bg-slate-800 p-3" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <button className="w-full rounded-lg bg-cyan-500 p-3 font-semibold text-slate-900 disabled:opacity-50" disabled={loading}>
          {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
        </button>
      </form>
      <button className="mt-4 text-sm text-cyan-300" onClick={() => setIsLogin((prev) => !prev)}>
        {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
      </button>
      {message && <p className="mt-4 text-sm text-amber-300">{message}</p>}
    </div>
  );
}
