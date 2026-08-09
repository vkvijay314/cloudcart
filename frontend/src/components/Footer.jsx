import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="bg-surface-bright border-t border-outline-variant mt-16">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10 px-4 md:px-[48px] py-16 max-w-[1440px] mx-auto">
        {/* Brand */}
        <div className="md:col-span-1">
          <span className="font-display text-sm font-black text-on-surface uppercase tracking-widest block mb-4">
            CloudCart
          </span>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            The future of unified commerce and financial management for modern teams.
          </p>
        </div>

        {/* Shop */}
        <div>
          <h5 className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wider">Shop</h5>
          <ul className="space-y-3">
            <li>
              <Link to="/products" className="text-sm text-on-surface-variant hover:text-primary transition-all underline decoration-primary/30">
                Products
              </Link>
            </li>
            <li>
              <Link to="/orders" className="text-sm text-on-surface-variant hover:text-primary transition-all underline decoration-primary/30">
                Orders
              </Link>
            </li>
            <li>
              <Link to="/cart" className="text-sm text-on-surface-variant hover:text-primary transition-all underline decoration-primary/30">
                Cart
              </Link>
            </li>
          </ul>
        </div>

        {/* Platform */}
        <div>
          <h5 className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wider">Platform</h5>
          <ul className="space-y-3">
            <li>
              <Link to="/expense" className="text-sm text-on-surface-variant hover:text-primary transition-all underline decoration-primary/30">
                Expense Splitter
              </Link>
            </li>
            <li>
              <span className="text-sm text-on-surface-variant">Privacy Policy</span>
            </li>
            <li>
              <span className="text-sm text-on-surface-variant">Terms of Service</span>
            </li>
          </ul>
        </div>

        {/* Newsletter */}
        <div>
          <h5 className="text-xs font-bold text-on-surface mb-4 uppercase tracking-wider">Newsletter</h5>
          <div className="flex gap-2">
            <input
              className="bg-white border border-outline-variant/50 rounded-lg px-4 py-2 text-sm w-full focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all"
              placeholder="Email"
              type="email"
            />
            <button className="p-2 bg-primary text-white rounded-lg hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-lg">send</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-4 border-t border-outline-variant/10 text-center">
        <p className="text-xs text-on-surface-variant">
          © {new Date().getFullYear()} CloudCart Inc. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

export default Footer;
