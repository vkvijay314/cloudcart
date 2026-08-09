import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../api/axios";
import useAuth from "../context/useAuth";

function AdminProducts() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    price: "",
    description: "",
    category: "",
    stock: ""
  });

  /* FETCH PRODUCTS */
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get("/products");
        setProducts(res.data.products || []);
      } catch (err) {
        console.error("Fetch products error:", err);
      }
    };
    fetchProducts();
  }, []);

  /* ADMIN GUARD */
  if (!user || user.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <span className="material-symbols-outlined text-6xl text-error mb-4">gpp_bad</span>
        <h2 className="font-display text-2xl font-bold">Access Denied</h2>
        <p className="text-on-surface-variant">You do not have permission to view this page.</p>
      </div>
    );
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm({ name: "", price: "", description: "", category: "", stock: "" });
    setImageFile(null);
    setEditingId(null);
    setIsModalOpen(false);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEdit = (product) => {
    setEditingId(product._id);
    setForm({
      name: product.name || "",
      price: product.price || "",
      description: product.description || "",
      category: product.category || "",
      stock: product.stock || ""
    });
    setImageFile(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;
    try {
      await api.delete(`/products/${id}`);
      setProducts(products.filter((p) => p._id !== id));
      toast.success("Product deleted successfully");
    } catch (err) {
      toast.error("Delete product failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("price", form.price);
      formData.append("description", form.description);
      formData.append("category", form.category);
      if (form.stock) formData.append("stock", form.stock);

      if (imageFile) {
        formData.append("image", imageFile);
      }

      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
      } else {
        await api.post("/products", formData);
      }

      resetForm();
      const res = await api.get("/products");
      setProducts(res.data.products || []);
      toast.success(editingId ? "Product updated successfully" : "Product added successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-[48px] py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      
      {/* ── Sidebar Nav ── */}
      <aside className="lg:col-span-2 space-y-2">
        <div className="mb-8">
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Admin Portal</span>
        </div>
        <Link to="/admin/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">dashboard</span> Dashboard
        </Link>
        <Link to="/admin/products" className="flex items-center gap-3 px-4 py-3 rounded-lg bg-primary-container/10 text-primary font-bold">
          <span className="material-symbols-outlined">inventory_2</span> Products
        </Link>
        <Link to="/orders" className="flex items-center gap-3 px-4 py-3 rounded-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined">receipt_long</span> Orders
        </Link>
      </aside>

      {/* ── Main Area ── */}
      <div className="lg:col-span-10 space-y-6">
        
        <div className="flex justify-between items-end">
          <div>
            <h1 className="font-display text-3xl font-bold">Product Inventory</h1>
            <p className="text-sm text-on-surface-variant mt-1">Manage your catalog, pricing, and stock.</p>
          </div>
          <button onClick={openAddModal} className="flex items-center gap-2 bg-primary text-on-primary px-6 py-3 rounded-lg font-bold shadow-md hover:bg-primary-container transition-all active:scale-95">
            <span className="material-symbols-outlined text-[20px]">add</span> Add Product
          </button>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded-xl border border-outline-variant/30 premium-shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low/50 border-b border-outline-variant/30 text-xs text-on-surface-variant uppercase tracking-wider">
                  <th className="px-6 py-4 font-bold">Product</th>
                  <th className="px-6 py-4 font-bold">Category</th>
                  <th className="px-6 py-4 font-bold">Price</th>
                  <th className="px-6 py-4 font-bold">Stock</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {products.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-10 text-center text-on-surface-variant">
                      No products found.
                    </td>
                  </tr>
                ) : (
                  products.map((p) => (
                    <tr key={p._id} className="hover:bg-surface-container-low/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-surface-container overflow-hidden shrink-0 border border-outline-variant/20">
                            {p.image ? (
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-outline-variant">
                                <span className="material-symbols-outlined text-[20px]">image</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-sm text-on-surface">{p.name}</p>
                            <p className="text-xs text-on-surface-variant truncate w-48">{p.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold px-2 py-1 bg-surface-container text-on-surface-variant rounded-md">
                          {p.category || "Uncategorized"}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-display font-semibold">₹{p.price}</td>
                      <td className="px-6 py-4">
                        {p.stock > 10 ? (
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">{p.stock} in stock</span>
                        ) : p.stock > 0 ? (
                          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">Low Stock ({p.stock})</span>
                        ) : (
                          <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded-full">Out of Stock</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleEdit(p)} className="p-2 text-primary hover:bg-primary-container/10 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">edit</span>
                          </button>
                          <button onClick={() => handleDelete(p._id)} className="p-2 text-error hover:bg-error-container/20 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[20px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Modal Overlay ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm" onClick={resetForm}></div>
          <div className="relative bg-white rounded-2xl premium-shadow w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="px-6 py-4 border-b border-outline-variant/30 flex justify-between items-center bg-surface-bright shrink-0">
              <h2 className="font-display text-xl font-bold">{editingId ? "Edit Product" : "Add New Product"}</h2>
              <button onClick={resetForm} className="material-symbols-outlined text-on-surface-variant hover:text-error transition-colors">close</button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-grow space-y-6">
              
              {/* Image Upload Area */}
              <div 
                className="w-full h-40 border-2 border-dashed border-outline-variant/50 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low hover:border-primary transition-all relative overflow-hidden"
                onClick={() => fileInputRef.current?.click()}
              >
                {imageFile || (editingId && form.image) ? (
                  <img src={imageFile ? URL.createObjectURL(imageFile) : form.image} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <span className="material-symbols-outlined text-4xl text-primary/50 mb-2">add_photo_alternate</span>
                    <span className="text-sm font-semibold text-primary">Click to upload product image</span>
                  </>
                )}
                <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={(e) => setImageFile(e.target.files[0])} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Product Name</label>
                  <input name="name" value={form.name} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Price (₹)</label>
                  <input name="price" type="number" value={form.price} onChange={handleChange} required className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Stock Quantity</label>
                  <input name="stock" type="number" value={form.stock} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Category</label>
                  <input name="category" value={form.category} onChange={handleChange} className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all" />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Description</label>
                  <textarea name="description" value={form.description} onChange={handleChange} required rows={3} className="w-full px-4 py-3 rounded-lg border border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none" />
                </div>
              </div>

              <div className="pt-4 border-t border-outline-variant/30 flex justify-end gap-3">
                <button type="button" onClick={resetForm} className="px-6 py-3 rounded-lg font-bold border border-outline-variant hover:bg-surface-container transition-all">Cancel</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-primary text-on-primary rounded-lg font-bold shadow-md hover:bg-primary-container active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                  {submitting ? "Saving..." : <><span className="material-symbols-outlined text-[18px]">save</span> Save Product</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default AdminProducts;
