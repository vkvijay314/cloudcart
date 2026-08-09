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
      className={`text-sm font-semibold transition-colors ${
        isActive(to)
          ? "text-primary font-bold border-b-2 border-primary pb-1"
          : "text-on-surface-variant hover:text-primary"
      }`}
    >
      {children}
    </Link>
  );

  const MobileNavItem = ({ to, icon, children }) => (
    <Link
      to={to}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
        isActive(to)
          ? "bg-primary text-on-primary font-bold shadow-sm shadow-primary/20"
          : "text-on-surface hover:bg-primary/10 hover:text-primary"
      }`}
    >
      {icon && <span className="material-symbols-outlined text-lg">{icon}</span>}
      <span>{children}</span>
    </Link>
  );

  return (
    <nav className="glass-nav sticky top-0 z-50 w-full border-b border-outline-variant/30 shadow-sm">
      <div className="flex justify-between items-center w-full px-4 md:px-[48px] py-3.5 max-w-[1440px] mx-auto">
        {/* Logo */}
        <Link to="/" className="font-display text-2xl font-bold text-primary tracking-tight">
          CloudCart
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
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
        <div className="flex items-center gap-3 sm:gap-6">
          {user && (
            <>
              <div className="flex items-center gap-1">
                <Link to="/wishlist" aria-label="Wishlist" className="relative material-symbols-outlined text-on-surface-variant hover:text-red-500 hover:bg-red-50 p-2 sm:p-2.5 rounded-full transition-all">
                  favorite
                </Link>
                <Link to="/cart" aria-label="Shopping Cart" className="relative material-symbols-outlined text-on-surface-variant hover:text-primary hover:bg-primary-container/20 p-2 sm:p-2.5 rounded-full transition-all">
                  shopping_cart
                </Link>
                {/* Notifications */}
                <button aria-label="Notifications" className="material-symbols-outlined text-on-surface-variant hover:bg-surface-container-low/80 p-2.5 rounded-full transition-all hidden sm:block">
                  notifications
                </button>
              </div>

              {/* User Avatar & Dropdown */}
              <div className="hidden sm:flex items-center gap-3 pl-2 border-l border-outline-variant/30">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-sm font-bold shadow-sm shadow-primary/20">
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col">
                  <span className="text-sm font-bold text-on-surface leading-tight">
                    {user.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="text-xs text-on-surface-variant hover:text-error text-left transition-colors cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Mobile Hamburger */}
          <button
            aria-label="Toggle Navigation Menu"
            className="md:hidden touch-target text-on-surface p-2 rounded-xl hover:bg-surface-container-low transition-all"
            onClick={() => setOpen(!open)}
          >
            <span className="material-symbols-outlined text-2xl">{open ? "close" : "menu"}</span>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {open && (
        <div className="md:hidden fixed inset-x-0 top-[65px] bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/30 p-5 shadow-2xl space-y-4 animate-in slide-in-from-top duration-200 z-50 max-h-[85vh] overflow-y-auto">
          {user && (
            <div className="flex items-center gap-3.5 pb-4 border-b border-outline-variant/20">
              <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white text-base font-bold shadow-md shadow-primary/20 shrink-0">
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-base font-bold text-on-surface truncate">{user.name}</span>
                <span className="text-xs text-on-surface-variant truncate">{user.email}</span>
              </div>
            </div>
          )}

          <div className="space-y-1.5 pt-1">
            <MobileNavItem to="/products" icon="storefront">Shop Catalog</MobileNavItem>
            {user && (
              <>
                <MobileNavItem to="/wishlist" icon="favorite">Wishlist</MobileNavItem>
                <MobileNavItem to="/cart" icon="shopping_cart">My Cart</MobileNavItem>
                <MobileNavItem to="/orders" icon="package_2">My Orders</MobileNavItem>
                <MobileNavItem to="/expense" icon="receipt_long">Expense Splitter</MobileNavItem>
                {user.role === "admin" && (
                  <>
                    <div className="pt-2 pb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-4">Admin Controls</span>
                    </div>
                    <MobileNavItem to="/admin/products" icon="inventory_2">Manage Products</MobileNavItem>
                    <MobileNavItem to="/admin/dashboard" icon="dashboard">Admin Analytics</MobileNavItem>
                  </>
                )}
              </>
            )}
          </div>

          <div className="pt-3 border-t border-outline-variant/20">
            {user ? (
              <button
                onClick={() => {
                  setOpen(false);
                  handleLogout();
                }}
                className="flex items-center gap-3 w-full py-3 px-4 rounded-xl text-sm font-semibold text-error bg-error-container/20 hover:bg-error-container/40 transition-all cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">logout</span>
                <span>Log Out</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Link
                  to="/login"
                  onClick={() => setOpen(false)}
                  className="w-full text-center py-3 px-4 rounded-xl border border-outline-variant text-on-surface text-sm font-bold hover:bg-surface-container-low transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setOpen(false)}
                  className="w-full text-center py-3 px-4 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-md shadow-primary/20 hover:bg-primary-container transition-all"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
