import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useState } from "react";
import api from "../api/axios";
import useAuth from "../context/useAuth";

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [quantity, setQuantity] = useState(1);

  const { data: product, isLoading, isError } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await api.get(`/products/${id}`);
      return res.data.product;
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

  const isWishlisted = wishlist.some(item => item._id === id || item === id);

  const toggleWishlistMutation = useMutation({
    mutationFn: async () => {
      if (isWishlisted) {
        return api.delete(`/user/wishlist/remove/${id}`);
      } else {
        return api.post("/user/wishlist/add", { productId: id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to update wishlist");
    }
  });

  const handleToggleWishlist = () => {
    if (!user) {
      toast.error("Please login to use wishlist");
      navigate("/login");
      return;
    }
    toggleWishlistMutation.mutate();
  };

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      return api.post("/cart/add", { productId: id, quantity });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success("Added to cart!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  });

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    addToCartMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <span className="material-symbols-outlined text-6xl text-error">error</span>
        <h2 className="font-display text-2xl font-bold">Product not found</h2>
        <button onClick={() => navigate("/products")} className="text-primary hover:underline font-semibold">
          Return to Catalog
        </button>
      </div>
    );
  }

  const isOutOfStock = product.stock <= 0;

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-10">
      
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-8">
        <Link to="/" className="hover:text-primary transition-colors">Home</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <Link to="/products" className="hover:text-primary transition-colors">Products</Link>
        <span className="material-symbols-outlined text-[16px]">chevron_right</span>
        <span className="font-semibold text-on-surface">{product.category}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
        
        {/* Left: Image Gallery */}
        <div className="space-y-6">
          <div className="w-full aspect-square bg-surface-container rounded-3xl overflow-hidden border border-outline-variant/30 floating">
            {product.image ? (
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="material-symbols-outlined text-8xl text-outline-variant/40">inventory_2</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-4 gap-4">
            {/* Mock thumbnails for premium feel */}
            {[1,2,3,4].map((i) => (
              <div key={i} className={`aspect-square rounded-xl bg-surface-container border-2 ${i===1 ? 'border-primary' : 'border-outline-variant/30'} overflow-hidden cursor-pointer hover:border-primary/50 transition-colors`}>
                {product.image ? (
                  <img src={product.image} alt="Thumbnail" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-surface-container-low" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="flex flex-col">
          <div className="mb-2 text-primary font-bold text-sm uppercase tracking-widest">{product.category}</div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-on-surface mb-4">{product.name}</h1>
          
          <div className="flex items-center gap-4 mb-6">
            <div className="flex text-amber-400 text-lg">
              <span className="material-symbols-outlined star-filled" style={{fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined star-filled" style={{fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined star-filled" style={{fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined star-filled" style={{fontVariationSettings: "'FILL' 1" }}>star</span>
              <span className="material-symbols-outlined">star_half</span>
            </div>
            <span className="text-sm font-semibold text-on-surface-variant hover:text-primary hover:underline cursor-pointer transition-colors">(124 reviews)</span>
          </div>

          <div className="font-display text-4xl font-bold text-on-surface mb-6">
            ₹{product.price}
          </div>

          <p className="text-on-surface-variant leading-relaxed text-lg mb-8">
            {product.description}
          </p>

          <div className="h-px w-full bg-outline-variant/30 mb-8" />

          {/* Action Area */}
          <div className="space-y-6">
            
            <div className="flex items-center justify-between">
              <span className="font-bold text-on-surface">Quantity</span>
              {isOutOfStock ? (
                <span className="text-sm font-bold text-error bg-error-container/30 px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">block</span> Out of Stock
                </span>
              ) : product.stock <= 5 ? (
                <span className="text-sm font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">warning</span> Only {product.stock} left
                </span>
              ) : (
                <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span> In Stock
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center border-2 border-outline-variant/50 rounded-xl bg-surface-bright p-1">
                <button 
                  className="w-12 h-12 flex items-center justify-center hover:bg-surface-container-low hover:text-primary transition-colors rounded-lg material-symbols-outlined disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={isOutOfStock || quantity <= 1}
                >
                  remove
                </button>
                <span className="w-12 text-center font-bold text-xl">{quantity}</span>
                <button 
                  className="w-12 h-12 flex items-center justify-center hover:bg-surface-container-low hover:text-primary transition-colors rounded-lg material-symbols-outlined disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={isOutOfStock || quantity >= product.stock}
                >
                  add
                </button>
              </div>

              <button 
                onClick={handleAddToCart}
                disabled={isOutOfStock || addToCartMutation.isPending}
                className="flex-1 py-4 bg-primary text-on-primary rounded-xl font-bold text-lg shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:pointer-events-none"
              >
                {addToCartMutation.isPending ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span className="material-symbols-outlined">shopping_cart</span>
                    {isOutOfStock ? "Sold Out" : "Add to Cart"}
                  </>
                )}
              </button>
              
              <button 
                onClick={handleToggleWishlist}
                className={`w-16 h-[60px] border-2 rounded-xl flex items-center justify-center transition-all ${
                  isWishlisted 
                    ? "border-red-500 bg-red-50 text-red-500" 
                    : "border-outline-variant/50 text-on-surface-variant hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                }`}
              >
                <span className="material-symbols-outlined text-2xl" style={isWishlisted ? { fontVariationSettings: "'FILL' 1" } : {}}>favorite</span>
              </button>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low/50">
              <span className="material-symbols-outlined text-primary text-3xl">local_shipping</span>
              <div>
                <h4 className="font-bold text-sm">Free Shipping</h4>
                <p className="text-xs text-on-surface-variant">On orders over ₹500</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 rounded-xl border border-outline-variant/30 bg-surface-container-low/50">
              <span className="material-symbols-outlined text-primary text-3xl">assignment_return</span>
              <div>
                <h4 className="font-bold text-sm">30-Day Returns</h4>
                <p className="text-xs text-on-surface-variant">Hassle-free return policy</p>
              </div>
            </div>
          </div>

        </div>
      </div>
      
    </div>
  );
}

export default ProductDetail;
