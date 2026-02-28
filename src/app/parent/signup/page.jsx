"use client";
import React, { useState } from "react";

// --- MOCKS FOR PREVIEW ENVIRONMENT ---
// These allow the code to compile in the browser-based preview without external server-only or build-time libraries.
const createBrowserClient = (url, key) => ({
  auth: {
    signUp: async ({ email, password }) => {
      console.log("Mock signing up:", email);
      return { data: { user: { email } }, error: null };
    }
  }
});

const useRouter = () => ({
  push: (path) => console.log("Mock navigating to:", path)
});

// Inlined Icons to avoid resolution errors
const UsersIcon = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);

const XCircleIcon = ({ size = 24, className = "" }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
);
// -------------------------------------

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
  );

  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : "",
        },
      });
      if (error) throw error;
      alert("Check your email for the verification link!");
      router.push("/parent/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-md rounded-[40px] p-10 shadow-2xl border-b-[12px] border-emerald-100 text-slate-900">
        <div className="bg-emerald-600 w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-white mb-6 shadow-lg shadow-emerald-100">
          <UsersIcon size={32} />
        </div>
        <h2 className="text-3xl font-black text-center text-slate-800 mb-2">Create Parent Account</h2>
        <p className="text-center text-slate-500 font-bold mb-8">Start managing your scholar's odyssey.</p>

        {error && (
          <div className="bg-rose-50 text-rose-600 p-4 rounded-xl mb-6 font-bold text-sm text-center border border-rose-100 flex items-center gap-2">
            <XCircleIcon size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-emerald-500 outline-none transition-all"
              placeholder="parent@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-400 mb-2 uppercase tracking-widest ml-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 font-bold focus:border-emerald-500 outline-none transition-all"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-lg py-5 rounded-[24px] shadow-xl transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-500 font-bold">
          Already have an account?{" "}
          <a href="/parent/login" className="text-emerald-600 hover:underline">Log In</a>
        </p>
      </div>
    </div>
  );
}
