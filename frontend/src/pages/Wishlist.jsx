import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";

function Wishlist() {
  const queryClient = useQueryClient();

  const { data: wishlist = [], isLoading } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await api.get("/users/wishlist");
      return res.data.wishlist || [];
    }
  });

  const removeFromWishlistMutation = useMutation({
    mutationFn: async (productId) => {
      return api.delete(`/users/wishlist/remove/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['wishlist']);
      toast.success("Removed from wishlist");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to remove");
    }
  });

  const addToCartMutation = useMutation({
    mutationFn: async (productId) => {
      return api.post("/cart/add", { productId, quantity: 1 });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success("Added to cart!");
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to add to cart");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-16">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-4xl font-bold text-on-surface mb-2">My Wishlist</h1>
          <p className="text-on-surface-variant">
            {wishlist.length} {wishlist.length === 1 ? "item" : "items"} saved for later
          </p>
        </div>
        <Link to="/products" className="text-primary font-semibold hover:underline flex items-center gap-2">
          Continue Shopping <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>

      {wishlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[40vh] bg-surface-container-low rounded-3xl border border-outline-variant/30">
          <span className="material-symbols-outlined text-6xl text-outline-variant/50 mb-4">favorite</span>
          <h2 className="text-xl font-display font-semibold mb-2">Your wishlist is empty</h2>
          <p className="text-on-surface-variant mb-6 text-center max-w-sm">
            Save items you like to your wishlist to keep track of them and easily buy them later.
          </p>
          <Link to="/products" className="bg-primary text-on-primary px-8 py-3 rounded-xl font-bold hover:bg-primary-container transition-all">
            Explore Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {wishlist.map(product => (
            <div key={product._id} className="bg-white border border-outline-variant/30 rounded-xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col relative">
              <button 
                onClick={() => removeFromWishlistMutation.mutate(product._id)}
                className="absolute top-4 right-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-error hover:bg-error hover:text-white transition-colors premium-shadow"
              >
                <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1" }}>delete</span>
              </button>

              <Link to={`/product/${product._id}`} className="aspect-square bg-surface-container-low overflow-hidden block relative">
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-outline-variant/30">inventory_2</span>
                  </div>
                )}
              </Link>

              <div className="p-5 flex flex-col flex-grow">
                <p className="text-xs text-on-surface-variant uppercase tracking-wider mb-1">{product.category}</p>
                <Link to={`/product/${product._id}`}>
                  <h3 className="font-semibold text-on-surface group-hover:text-primary transition-colors mb-2">{product.name}</h3>
                </Link>
                <div className="font-bold text-lg mb-4">₹{product.price}</div>
                
                <div className="mt-auto">
                  <button 
                    onClick={() => addToCartMutation.mutate(product._id)}
                    disabled={addToCartMutation.isPending && addToCartMutation.variables === product._id}
                    className="w-full py-3 bg-surface-container-low text-on-surface font-semibold rounded-lg hover:bg-primary hover:text-on-primary transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">shopping_cart</span>
                    Add to Cart
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Wishlist;
