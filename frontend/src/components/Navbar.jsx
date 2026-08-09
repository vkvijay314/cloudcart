import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { toast } from "react-hot-toast";
import useAuth from "../context/useAuth";

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/");
    toast.success("Logged out successfully");
  };

  const isActive = (path) => location.pathname === path;

  const NavItem = ({ to, children }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={`text-label-md transition-colors ${
        isActive(to)
          ? "text-primary font-bold border-b-2 border-primary pb-1"
          : "text-on-surface-variant hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center w-full px-4 md:px-[48px] py-4 max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl font-bold text-primary tracking-tight">
          CloudCart
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-10">
          <NavItem to="/products">Shop</NavItem>
          {user && (
            <>
              <NavItem to="/orders">Orders</NavItem>
              <NavItem to="/expense">Split Expenses</NavItem>
              {user.role === "admin" && (
                <>
                  <NavItem to="/admin/products">Admin</NavItem>
                  <NavItem to="/admin/dashboard">Dashboard</NavItem>
                </>
              )}
            </>
          )}
          {!user && (
            <>
              <NavItem to="/login">Login</NavItem>
              <NavItem to="/register">Register</NavItem>
            </>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-6">
          {user && (
            <>
              <div className="flex items-center gap-1">
                <Link to="/wishlist" className="relative material-symbols-outlined text-on-surface-variant hover:text-red-500 hover:bg-red-50 p-2.5 rounded-full transition-all">
                  favorite
                </Link>
                <Link to="/cart" className="relative material-symbols-outlined text-on-surface-variant hover:text-primary hover:bg-primary-container/20 p-2.5 rounded-full transition-all">
                  shopping_cart
                </Link>
                {/* Notifications */}
                <button className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low/80 p-2.5 rounded-full transition-all hidden sm:block">
                  notifications
                </button>
              </div>

              {/* User Avatar & Dropdown */}
              <div className="flex items-center gap-3 pl-2 border-l border-outline-variant/30">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-sm font-bold text-on-surface leading-tight">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-on-surface-variant hover:text-error text-left transition-colors"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Mobile Hamburger */}
          <button
            className="md:hidden material-symbols-outlined text-on-surface p-2"
            onClick={() => setOpen(!open)}
          >
            {open ? "close" : "menu"}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white border-t border-outline-variant/30 px-4 py-4 space-y-3 animate-in slide-in-from-top">
          <NavItem to="/products">Shop</NavItem>
          {user && (
            <>
              <NavItem to="/wishlist">Wishlist</NavItem>
              <NavItem to="/cart">Cart</NavItem>
              <NavItem to="/orders">Orders</NavItem>
              <NavItem to="/expense">Expense Splitter</NavItem>
              {user.role === "admin" && (
                <>
                  <NavItem to="/admin/products">Admin</NavItem>
                  <NavItem to="/admin/dashboard">Dashboard</NavItem>
                </>
              )}
              <button
                onClick={handleLogout}
                className="text-label-md text-error hover:underline w-full text-left pt-2 border-t border-outline-variant/20"
              >
                Logout
              </button>
            </>
          )}
          {!user && (
            <>
              <NavItem to="/login">Login</NavItem>
              <NavItem to="/register">Register</NavItem>
            </>
          )}
        </div>
      )}
    </nav>
  );
}

export default Navbar;
