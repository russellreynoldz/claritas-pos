import { useState } from "react";
import { apiRequest } from "../services/api";
import Icon from "../components/Icon";
import { IC } from "../data/icons";

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username is required";
    if (!password) e.password = "Password is required";
    return e;
  };

  const submit = async () => {
    const e = validate();
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const user = await apiRequest("/login", {
        method: "POST",
        body: JSON.stringify({ username, password }),
      });

      // IMPORTANT: send the whole user object, including role
      onLogin(user);
    } catch (err) {
      setErrors({ password: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-slate-900 px-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] bg-emerald-600 opacity-[0.07] rounded-full blur-3xl" />
        <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-teal-400 opacity-[0.06] rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-[400px]">
        <div className="bg-slate-800/60 backdrop-blur-2xl border border-white/[0.08] rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center gap-3 mb-8">
            <img
              src="/cart.png"
              alt="Logo"
              className="w-20 h-20 object-contain"
            />
            <div>
              <span className="text-white font-bold text-lg tracking-tight block leading-none">
                Clarita's Mini Grocery
              </span>
              <span className="text-emerald-400 text-xs font-medium">
                Point of Sale System
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">
            Login
          </h1>
          <p className="text-slate-400 text-sm mb-7">
            Enter your username and password
          </p>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Username
            </label>

            <div className="relative">
              <Icon
                d={IC.user}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setErrors((p) => ({ ...p, username: "" }));
                }}
                onKeyDown={(e) =>
                  e.key === "Enter" &&
                  document.getElementById("pw-login")?.focus()
                }
                placeholder="Enter username"
                className={`w-full h-11 pl-10 pr-4 rounded-xl bg-slate-900/60 border text-white text-sm placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                  errors.username ? "border-red-500" : "border-white/10"
                }`}
              />
            </div>

            {errors.username && (
              <p className="text-red-400 text-xs mt-1">{errors.username}</p>
            )}
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">
              Password
            </label>

            <div className="relative">
              <Icon
                d={IC.lock}
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
              />
              <input
                id="pw-login"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((p) => ({ ...p, password: "" }));
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="••••••••"
                className={`w-full h-11 pl-10 pr-11 rounded-xl bg-slate-900/60 border text-white text-sm placeholder-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all ${
                  errors.password ? "border-red-500" : "border-white/10"
                }`}
              />

              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <Icon d={showPw ? IC.eyeOff : IC.eye} size={16} />
              </button>
            </div>

            {errors.password && (
              <p className="text-red-400 text-xs mt-1">{errors.password}</p>
            )}
          </div>

          <button
            onClick={submit}
            disabled={loading}
            className="w-full h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] transition-all disabled:opacity-60 shadow-lg shadow-emerald-900/50"
          >
            {loading ? (
              <svg
                className="animate-spin w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4" />
              </svg>
            ) : (
              <>
                Login <Icon d={IC.arrowRight} size={16} />
              </>
            )}
          </button>
        </div>

        <p className="text-center text-slate-600 text-xs mt-5">
          © 2026 Clarita's Mini Grocery
        </p>
      </div>
    </div>
  );
}