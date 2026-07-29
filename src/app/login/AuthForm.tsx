"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../../lib/supabase/client";
import { Loader2, ArrowRight } from "lucide-react";

export default function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.includes(" ")) {
      setError("Username cannot contain spaces.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      setLoading(false);
      return;
    }

    // This creates a fake email strictly for Supabase behind the scenes.
    // The user will never see or use this email.
    const dummyEmail = `${cleanUsername}@users.snapvault.com`;

    try {
      if (isLogin) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: dummyEmail,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email: dummyEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
            },
          },
        });
        if (signUpError) throw signUpError;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      if (err.message.includes("Invalid login credentials")) {
        setError("Incorrect username or password.");
      } else if (err.message.includes("already registered")) {
        setError("Username is already taken.");
      } else {
        setError(err.message || "An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative z-10 w-full max-w-md mx-auto p-8 rounded-3xl bg-neutral-900/40 backdrop-blur-2xl border border-white/10 shadow-2xl">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-medium tracking-tight text-white mb-2">
          {isLogin ? "Welcome back" : "Create an account"}
        </h1>
        <p className="text-neutral-400 text-sm">
          {isLogin
            ? "Enter your details to access your vault."
            : "Set up your unique username and password."}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            required
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck="false"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-black/50 border border-white/5 rounded-xl px-4 py-3 text-white placeholder-neutral-600 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all"
            required
          />
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="group relative w-full flex justify-center items-center gap-2 py-3.5 px-4 bg-white text-black font-medium rounded-xl hover:bg-neutral-200 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-6"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {isLogin ? "Sign In" : "Sign Up"}
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError(null);
          }}
          className="text-sm text-neutral-400 hover:text-white transition-colors"
        >
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </button>
      </div>
    </div>
  );
}