import { useState, useEffect, useCallback } from 'react';
import { checkoutApi } from '../services/api';
import { showToast } from '../components/Toast';

const TAX_RATE = 0.05;

function AddCustomerModal({ onClose, onAdded }) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zip_code, setZip_code] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await checkoutApi.createCustomer({
        name: name.trim(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        zip_code: zip_code.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
      });
      onAdded(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add customer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-surface-900/50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold text-surface-900 mb-4">Add new customer</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-surface-700 mb-1">City</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1">State</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-surface-700 mb-1">ZIP</label>
            <input
              type="text"
              value={zip_code}
              onChange={(e) => setZip_code(e.target.value)}
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30"
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2 border border-surface-200 rounded-lg font-medium text-surface-700 hover:bg-surface-50">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="flex-1 py-2 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-800 disabled:opacity-50">
              {loading ? 'Adding…' : 'Add customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Checkout() {
  const [customers, setCustomers] = useState([]);
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadCustomers = useCallback(() => {
    checkoutApi.getCustomers().then((res) => setCustomers(res.data.data || [])).catch(() => setCustomers([]));
  }, []);

  const searchCustomers = useCallback((q) => {
    if (!q.trim()) return loadCustomers();
    checkoutApi.searchCustomers(q).then((res) => setCustomers(res.data.data || [])).catch(() => setCustomers([]));
  }, [loadCustomers]);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  useEffect(() => {
    const q = productSearch.trim();
    setLoadingProducts(true);
    checkoutApi.getProducts(q).then((res) => setProducts(res.data.data || [])).finally(() => setLoadingProducts(false));
  }, [productSearch]);

  const addToCart = (product, qty = 1) => {
    const stock = Number(product.stock ?? 0);
    if (stock < qty) {
      showToast('Insufficient stock', 'error');
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.id === product.id);
      const newQty = (existing?.quantity ?? 0) + qty;
      if (newQty > stock) {
        showToast('Quantity exceeds stock', 'error');
        return prev;
      }
      if (existing) return prev.map((c) => (c.id === product.id ? { ...c, quantity: newQty } : c));
      return [...prev, { ...product, quantity: qty }];
    });
  };

  const updateCartQty = (productId, delta) => {
    setCart((prev) => {
      const item = prev.find((c) => c.id === productId);
      if (!item) return prev;
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((c) => c.id !== productId);
      if (newQty > (item.stock ?? 0)) {
        showToast('Cannot exceed stock', 'error');
        return prev;
      }
      return prev.map((c) => (c.id === productId ? { ...c, quantity: newQty } : c));
    });
  };

  const removeFromCart = (productId) => setCart((prev) => prev.filter((c) => c.id !== productId));

  const subtotal = cart.reduce((s, c) => s + Number(c.price) * c.quantity, 0);
  const tax = subtotal * TAX_RATE;
  const grandTotal = subtotal + tax;

  const placeOrder = async () => {
    if (!selectedCustomer) {
      showToast('Select a customer', 'error');
      return;
    }
    if (cart.length === 0) {
      showToast('Add at least one product', 'error');
      return;
    }
    setLoadingOrders(true);
    try {
      await checkoutApi.createOrder({
        customerId: selectedCustomer.id,
        items: cart.map((c) => ({ productId: c.id, quantity: c.quantity })),
      });
      showToast('Order placed successfully', 'success');
      setCart([]);
      setSelectedCustomer(null);
    } catch (err) {
      showToast(err.response?.data?.message || 'Order failed', 'error');
    } finally {
      setLoadingOrders(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-surface-900">Checkout</h1>
        <p className="text-surface-500 mt-0.5">POS – select customer, add products, complete order</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <h2 className="text-sm font-semibold text-surface-900 mb-3">Customer</h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => { setCustomerSearch(e.target.value); searchCustomers(e.target.value); }}
                onFocus={() => searchCustomers(customerSearch)}
                placeholder="Search by name, email, phone"
                className="flex-1 px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500"
              />
              <button
                type="button"
                onClick={() => setShowAddCustomer(true)}
                className="px-4 py-2 border border-surface-200 rounded-lg font-medium text-surface-700 hover:bg-surface-50"
              >
                New customer
              </button>
            </div>
            {selectedCustomer && (
              <p className="mt-2 text-sm text-surface-600">
                Selected: <strong>{selectedCustomer.name}</strong> {selectedCustomer.email && `(${selectedCustomer.email})`}
              </p>
            )}
            <ul className="mt-2 max-h-40 overflow-y-auto border border-surface-100 rounded-lg divide-y divide-surface-100">
              {customers.slice(0, 10).map((c) => (
                <li
                  key={c.id}
                  onClick={() => { setSelectedCustomer(c); setCustomerSearch(''); setCustomers([]); }}
                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-surface-50 ${selectedCustomer?.id === c.id ? 'bg-primary-50 text-primary-800' : 'text-surface-700'}`}
                >
                  {c.name} {c.email && ` · ${c.email}`}
                </li>
              ))}
              {customers.length === 0 && !customerSearch && <li className="px-3 py-2 text-sm text-surface-400">Search or add a customer</li>}
            </ul>
          </div>

          <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5">
            <h2 className="text-sm font-semibold text-surface-900 mb-3">Products</h2>
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search products"
              className="w-full px-3 py-2 border border-surface-200 rounded-lg focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 mb-3"
            />
            {loadingProducts ? (
              <p className="text-sm text-surface-500">Loading…</p>
            ) : (
              <ul className="max-h-64 overflow-y-auto space-y-1">
                {products.map((p) => (
                  <li key={p.id} className="flex items-center justify-between py-2 border-b border-surface-100 last:border-0">
                    <span className="text-sm text-surface-800">{p.name}</span>
                    <span className="text-sm text-surface-500">Stock: {p.stock ?? 0} · ₹{Number(p.price).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(p)}
                      disabled={(p.stock ?? 0) < 1}
                      className="text-sm font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Add
                    </button>
                  </li>
                ))}
                {products.length === 0 && <li className="text-sm text-surface-400">No products found</li>}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-surface-200 shadow-card p-5 h-fit">
          <h2 className="text-sm font-semibold text-surface-900 mb-3">Order summary</h2>
          <ul className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {cart.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-surface-800">{c.name}</span>
                  <button type="button" onClick={() => updateCartQty(c.id, -1)} className="w-6 h-6 rounded border border-surface-200 hover:bg-surface-100">−</button>
                  <span>{c.quantity}</span>
                  <button type="button" onClick={() => updateCartQty(c.id, 1)} className="w-6 h-6 rounded border border-surface-200 hover:bg-surface-100">+</button>
                  <button type="button" onClick={() => removeFromCart(c.id)} className="text-red-600 hover:underline">Remove</button>
                </div>
                <span>₹{(Number(c.price) * c.quantity).toFixed(2)}</span>
              </li>
            ))}
            {cart.length === 0 && <li className="text-surface-400">Cart is empty</li>}
          </ul>
          <div className="border-t border-surface-200 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-surface-600"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-surface-600"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
            <div className="flex justify-between font-semibold text-surface-900 pt-2"><span>Total</span><span>₹{grandTotal.toFixed(2)}</span></div>
          </div>
          <button
            type="button"
            onClick={placeOrder}
            disabled={loadingOrders || !selectedCustomer || cart.length === 0}
            className="w-full mt-4 py-3 bg-surface-900 text-white rounded-lg font-medium hover:bg-surface-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-250"
          >
            {loadingOrders ? 'Placing order…' : 'Complete order'}
          </button>
        </div>
      </div>

      {showAddCustomer && (
        <AddCustomerModal
          onClose={() => setShowAddCustomer(false)}
          onAdded={(newCustomer) => { setSelectedCustomer(newCustomer); loadCustomers(); }}
        />
      )}
    </div>
  );
}
