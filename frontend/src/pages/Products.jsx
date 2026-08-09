import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../context/useAuth";

function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All Products");
  const [priceRange, setPriceRange] = useState(10000);
  const [sort, setSort] = useState("Recommended");
  const [addingToCart, setAddingToCart] = useState(null);

  const { data: products = [], isLoading: loading } = useQuery({
    queryKey: ['products', search, category, priceRange, sort],
    queryFn: async () => {
      const res = await api.get("/products", {
        params: {
          search: search || undefined,
          category: category !== "All Products" ? category : undefined,
          maxPrice: priceRange < 10000 ? priceRange : undefined,
          sort: sort !== "Recommended" ? sort : undefined
        }
      });
      return res.data.products || [];
    }
  });

  const { data: wishlist = [] } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      if (!user) return [];
      const res = await api.get("/user/wishlist");
      return res.data.wishlist || [];
    },
    enabled: !!user
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async ({ productId, isWishlisted }) => {
      if (isWishlisted) {
        return api.delete(`/user/wishlist/remove/${productId}`);
      } else {
        return api.post("/user/wishlist/add", { productId });
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(variables.isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    }
  });

  const handleToggleWishlist = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to use wishlist");
      navigate("/login");
      return;
    }
    const isWishlisted = wishlist.some(item => item._id === productId || item === productId);
    toggleWishlistMutation.mutate({ productId, isWishlisted });
  };

  const addToCartMutation = useMutation({
    mutationFn: async (productId) => {
      setAddingToCart(productId);
      return api.post("/cart/add", { productId, quantity: 1 });
    },
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    },
    onSettled: () => {
      setAddingToCart(null);
    }
  });

  const handleAddToCart = (productId) => {
    addToCartMutation.mutate(productId);
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-16 flex gap-6">
      {/* ── Sidebar Filters ── */}
      <aside className="hidden lg:flex flex-col w-64 shrink-0 gap-8">
        <div>
          <h3 className="font-display text-2xl font-semibold mb-2">Filters</h3>
          <div className="h-px bg-outline-variant/30 w-full mb-6" />
        </div>

        {/* Search */}
        <section>
          <h4 className="text-sm font-semibold text-on-surface mb-3">Search</h4>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </section>

        {/* Categories */}
        <section>
          <h4 className="text-sm font-semibold text-on-surface mb-3">Categories</h4>
          <div className="flex flex-col gap-1">
            {["All Products", "Electronics", "Clothing", "Lifestyle"].map((cat) => (
              <label key={cat} className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-surface-container-low transition-colors">
                <input 
                  type="checkbox" 
                  checked={category === cat}
                  onChange={() => setCategory(cat)}
                  className="w-4 h-4 rounded border-outline text-primary focus:ring-primary" 
                />
                <span className="text-sm text-on-surface-variant group-hover:text-on-surface">{cat}</span>
              </label>
            ))}
          </div>
        </section>

        {/* Price Range */}
        <section>
          <h4 className="text-sm font-semibold text-on-surface mb-3">Max Price: ₹{priceRange < 10000 ? priceRange : "10,000+"}</h4>
          <input 
            type="range" 
            min="0"
            max="10000"
            step="500"
            value={priceRange}
            onChange={(e) => setPriceRange(Number(e.target.value))}
            className="w-full h-1 bg-surface-container-highest rounded-lg appearance-none cursor-pointer accent-primary" 
          />
          <div className="flex justify-between mt-2 text-xs text-on-surface-variant">
            <span>₹0</span>
            <span>₹10,000+</span>
          </div>
        </section>
      </aside>

      {/* ── Product Grid ── */}
      <div className="flex-1">
        <header className="flex justify-between items-end mb-10">
          <div>
            <h2 className="font-display text-3xl font-semibold text-on-surface mb-1">All Products</h2>
            <p className="text-sm text-on-surface-variant">
              Showing {products.length} product{products.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-on-surface-variant">Sort by:</span>
            <select 
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-transparent border-none text-sm font-semibold text-primary focus:ring-0 cursor-pointer"
            >
              <option value="Recommended">Recommended</option>
              <option value="Price: Low to High">Price: Low to High</option>
              <option value="Price: High to Low">Price: High to Low</option>
              <option value="Newest Arrivals">Newest Arrivals</option>
            </select>
          </div>
        </header>

        {/* Mobile Search */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              className="w-full pl-10 pr-4 py-3 bg-surface-container-low border border-outline-variant/30 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-on-surface-variant">
            <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
            <p className="text-lg font-semibold">No products found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {products.map((product) => {
              const isWishlisted = wishlist.some(item => item._id === product._id || item === product._id);
              
              return (
              <article
                key={product._id}
                className="product-card bg-white border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col"
              >
                <div className="aspect-square bg-surface-container-low overflow-hidden relative block">
                  <Link to={`/product/${product._id}`} className="block w-full h-full">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="zoom-img w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-7xl text-outline-variant/30">
                          inventory_2
                        </span>
                      </div>
                    )}
                  </Link>
                  {product.stock <= 5 && product.stock > 0 && (
                    <div className="absolute top-4 left-4 bg-error-container text-on-error-container px-2 py-1 rounded-full text-xs font-semibold shadow-sm pointer-events-none">
                      Low Stock
                    </div>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute top-4 left-4 bg-outline-variant text-on-surface px-2 py-1 rounded-full text-xs font-semibold shadow-sm pointer-events-none">
                      Out of Stock
                    </div>
                  )}
                  
                  <button 
                    onClick={(e) => handleToggleWishlist(e, product._id)}
                    className="absolute top-4 right-4 z-10 w-9 h-9 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-sm opacity-0 group-hover:opacity-100 focus:opacity-100"
                  >
                    <span className="material-symbols-outlined text-[20px]" style={isWishlisted ? { fontVariationSettings: "'FILL' 1", color: "#ef4444" } : {}}>favorite</span>
                  </button>
                </div>

                <div className="p-6 flex flex-col flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <Link to={`/product/${product._id}`}>
                      <h3 className="text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                    </Link>
                    <span className="text-sm font-semibold text-secondary">₹{product.price}</span>
                  </div>
                  <p className="text-sm text-on-surface-variant mb-4 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-outline-variant/20 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-on-surface-variant px-2 py-1 bg-primary/10 text-primary rounded-full font-semibold">
                        {product.category}
                      </span>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product._id)}
                      disabled={addingToCart === product._id || product.stock === 0}
                      className="bg-surface-container-high hover:bg-primary hover:text-on-primary p-2 rounded-lg transition-colors active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-symbols-outlined text-lg">
                        {addingToCart === product._id ? "hourglass_empty" : "shopping_cart"}
                      </span>
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default Products;
