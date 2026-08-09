import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../api/axios";

function Home() {
  const { data: featuredProducts = [] } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: async () => {
      const res = await api.get("/products");
      return (res.data.products || []).slice(0, 4);
    }
  });

  return (
    <>
      {/* ── Hero Section ── */}
      <header className="relative min-h-[85vh] flex items-center pt-16 overflow-hidden hero-glow">
        <div className="w-full px-4 md:px-[48px] max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center z-10">
          <div className="max-w-2xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary-container/10 text-primary font-semibold text-xs mb-6 border border-primary/20">
              All-in-one Commerce
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-on-surface leading-tight tracking-tight">
              Shop Smarter. <br />
              <span className="text-primary">Manage Expenses Better.</span>
            </h1>
            <p className="text-lg text-on-surface-variant mb-10 max-w-lg leading-relaxed">
              CloudCart helps teams and individuals shop online, manage orders, and split expenses effortlessly with enterprise-grade financial tools.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/products"
                className="bg-primary text-on-primary px-10 py-4 rounded-xl font-semibold text-sm hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95"
              >
                Start Shopping
              </Link>
              <Link
                to="/expense"
                className="bg-white border border-outline-variant text-on-surface px-10 py-4 rounded-xl font-semibold text-sm hover:bg-surface-container-low transition-all active:scale-95"
              >
                Split Expenses
              </Link>
            </div>
            <div className="mt-10 flex items-center gap-6 grayscale opacity-50">
              <span className="text-xs text-outline uppercase tracking-widest">Trusted by</span>
              <div className="flex gap-8">
                <span className="font-display font-bold text-2xl">VELOCITY</span>
                <span className="font-display font-bold text-2xl">AURORA</span>
                <span className="font-display font-bold text-2xl">PULSE</span>
              </div>
            </div>
          </div>

          {/* Floating Visuals */}
          <div className="relative h-[500px] hidden lg:block">
            <div className="absolute top-10 right-0 w-80 glass-card p-6 rounded-xl floating z-20">
              <div className="w-full h-48 rounded-lg mb-4 overflow-hidden bg-surface-container flex items-center justify-center">
                <img
                  src="/images/vision_pro_watch.png"
                  alt="Vision Pro Watch"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-display font-semibold">Vision Pro Watch</h3>
                <span className="text-primary font-bold">$499.00</span>
              </div>
              <div className="flex gap-1 mb-4">
                <span className="w-3 h-3 rounded-full bg-primary" />
                <span className="w-3 h-3 rounded-full bg-outline-variant" />
                <span className="w-3 h-3 rounded-full bg-tertiary" />
              </div>
              <button className="w-full bg-on-surface text-white py-3 rounded-lg text-sm font-semibold">
                Add to Cart
              </button>
            </div>

            {/* Expense Widget */}
            <div className="absolute bottom-10 left-0 w-72 glass-card p-6 rounded-xl floating-delayed z-30">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-secondary bg-secondary/10 p-1.5 rounded-lg">
                    receipt_long
                  </span>
                  <span className="font-semibold text-sm">Split Expense</span>
                </div>
                <span className="text-xs text-outline">Pending</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-2 border-b border-outline-variant/20">
                  <span className="text-sm">Office Gear</span>
                  <span className="font-bold">$120.00</span>
                </div>
                <div className="flex -space-x-2 pt-2">
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-primary-container flex items-center justify-center text-[10px] text-white font-bold">JD</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-tertiary flex items-center justify-center text-[10px] text-white font-bold">AS</div>
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] text-white font-bold">+2</div>
                </div>
              </div>
            </div>

            {/* Abstract Glows */}
            <div className="absolute -top-10 -right-20 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
            <div className="absolute -bottom-20 -left-10 w-64 h-64 bg-secondary/10 blur-[80px] rounded-full" />
          </div>
        </div>
      </header>

      {/* ── Features Section ── */}
      <section className="py-16 bg-surface-bright">
        <div className="px-4 md:px-[48px] max-w-[1440px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl font-semibold mb-4">The platform that does both.</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">
              Why choose between a shopping cart and a budget tracker? CloudCart merges your commercial and financial life into one seamless flow.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Shop Side */}
            <div className="bg-white p-10 rounded-[32px] border border-outline-variant shadow-sm hover:-translate-y-1 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-primary-container/10 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">shopping_bag</span>
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3">Premium Marketplace</h3>
              <p className="text-on-surface-variant mb-6">
                Access a curated selection of high-end electronics, lifestyle products, and office essentials directly within the ecosystem.
              </p>
              <ul className="space-y-2 text-sm text-on-surface">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-base">check_circle</span> 1-Click Secure Checkout</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-base">check_circle</span> Multi-vendor Order Tracking</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-primary text-base">check_circle</span> AI-Powered Recommendations</li>
              </ul>
            </div>

            {/* Expense Side */}
            <div className="bg-white p-10 rounded-[32px] border border-outline-variant shadow-sm hover:-translate-y-1 transition-all group">
              <div className="w-16 h-16 rounded-2xl bg-secondary-container/10 flex items-center justify-center text-secondary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl">group_work</span>
              </div>
              <h3 className="font-display text-2xl font-semibold mb-3">Expense Intelligence</h3>
              <p className="text-on-surface-variant mb-6">
                Splitting the bill for team equipment or home supplies has never been easier. Instant calculation and transparent tracking.
              </p>
              <ul className="space-y-2 text-sm text-on-surface">
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-base">check_circle</span> Automated Cost Allocation</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-base">check_circle</span> Real-time Debt Settlement</li>
                <li className="flex items-center gap-2"><span className="material-symbols-outlined text-secondary text-base">check_circle</span> Insightful Monthly Reports</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="py-16">
        <div className="px-4 md:px-[48px] max-w-[1440px] mx-auto">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="font-display text-3xl font-semibold">Featured Selection</h2>
              <p className="text-on-surface-variant">Quality goods curated for the modern professional.</p>
            </div>
            <Link to="/products" className="flex items-center gap-2 text-primary font-semibold text-sm hover:underline">
              View All Products <span className="material-symbols-outlined">arrow_forward</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <div key={product._id} className="bg-white rounded-xl overflow-hidden border border-outline-variant group hover:shadow-xl transition-all">
                <Link to={`/product/${product._id}`} className="relative overflow-hidden aspect-square bg-surface-container-low block">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-6xl text-outline-variant/40">
                        inventory_2
                      </span>
                    </div>
                  )}
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-4 left-4 bg-error-container text-on-error-container px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm pointer-events-none">
                      Low Stock
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-outline-variant text-on-surface px-2 py-1 rounded-full text-[10px] font-semibold shadow-sm pointer-events-none">
                      Out of Stock
                    </div>
                  )}
                </Link>
                <div className="p-6">
                  <p className="text-xs text-outline mb-1 uppercase tracking-wider">{product.category}</p>
                  <Link to={`/product/${product._id}`}>
                    <h4 className="font-semibold mb-4 hover:text-primary transition-colors">{product.name}</h4>
                  </Link>
                  <div className="flex justify-between items-center">
                    <span className="font-display text-xl text-primary font-semibold">₹{product.price}</span>
                    <Link
                      to="/products"
                      className="material-symbols-outlined bg-surface-container-low text-on-surface p-2 rounded-full hover:bg-primary hover:text-white transition-colors"
                    >
                      add_shopping_cart
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Bento Grid ── */}
      <section className="py-16 bg-surface-container-low">
        <div className="px-4 md:px-[48px] max-w-[1440px] mx-auto">
          <h2 className="font-display text-3xl font-semibold mb-10 text-center">Manage Everything in One Place</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[200px]">
            {/* Large Dashboard Card */}
            <div className="md:col-span-2 md:row-span-2 bg-white rounded-[32px] p-10 border border-outline-variant flex flex-col justify-between">
              <div>
                <h3 className="font-display text-2xl font-semibold mb-2">Expense Dashboard</h3>
                <p className="text-on-surface-variant max-w-md">
                  Track your team's spending habits with granular detail. Visual charts help you understand where your budget goes each month.
                </p>
              </div>
              <div className="w-full h-48 bg-surface-container rounded-2xl flex items-end justify-between p-6 gap-2">
                {[40, 65, 45, 90, 70, 55].map((h, i) => (
                  <div key={i} className="w-full bg-primary/20 rounded-t-lg transition-all hover:bg-primary" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>

            {/* Quick Action */}
            <div className="bg-primary text-on-primary rounded-[32px] p-10 flex flex-col justify-center items-center text-center">
              <span className="material-symbols-outlined text-4xl mb-2">bolt</span>
              <h4 className="font-bold text-lg">Instant Settle</h4>
              <p className="text-sm opacity-80">Pay your friends back in one tap.</p>
            </div>

            {/* Groups */}
            <div className="bg-white rounded-[32px] p-10 border border-outline-variant flex flex-col justify-between">
              <h4 className="font-bold">Active Groups</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">Marketing Retreat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500" />
                  <span className="text-sm">Roommates Q3</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Home;
