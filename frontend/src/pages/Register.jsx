import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../context/useAuth";

function Register() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.post("/auth/register", form);
      toast.success("Account created successfully! Please login.");
      // Automatically login after successful registration or navigate to login
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.google) return;

    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: async (response) => {
        try {
          const res = await api.post("/auth/google", { token: response.credential });
          login(res.data.token, res.data.user);
          toast.success("Welcome to CloudCart!");
          navigate("/");
        } catch {
          toast.error("Google sign up failed");
        }
      }
    });

    window.google.accounts.id.renderButton(
      document.getElementById("google-register-btn"),
      { theme: "outline", size: "large", text: "continue_with", width: Math.min(320, window.innerWidth - 64) }
    );
  }, [login, navigate]);

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-6 sm:py-12 px-3 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 blur-[120px] rounded-full mix-blend-multiply"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-md space-y-6 sm:space-y-8 glass-card p-6 sm:p-8 md:p-10 rounded-[1.5rem] sm:rounded-[2rem] premium-shadow border border-white/50 relative z-10">
        <div className="text-center">
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-on-surface">
            Create an account
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Join CloudCart to start shopping and splitting expenses.
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Name</label>
              <input
                name="name"
                type="text"
                required
                value={form.name}
                onChange={handleChange}
                className="w-full rounded-xl border border-outline-variant/50 px-4 py-3.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Email</label>
              <input
                name="email"
                type="email"
                required
                value={form.email}
                onChange={handleChange}
                className="w-full rounded-xl border border-outline-variant/50 px-4 py-3.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Password</label>
              <input
                name="password"
                type="password"
                required
                value={form.password}
                onChange={handleChange}
                className="w-full rounded-xl border border-outline-variant/50 px-4 py-3.5 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white/50 backdrop-blur-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-primary text-on-primary rounded-xl font-bold shadow-md shadow-primary/20 hover:bg-primary-container active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant/30" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-surface px-2 text-on-surface-variant text-xs uppercase tracking-widest font-semibold rounded-full">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <div id="google-register-btn" className="overflow-hidden rounded-xl shadow-sm"></div>
          </div>
        </div>

        <p className="mt-8 text-center text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary-container transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;