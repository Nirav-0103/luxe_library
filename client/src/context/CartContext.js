import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();
export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem('lib_cart');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('lib_cart', JSON.stringify(items));
  }, [items]);

  const addToCart = (book) => {
    setItems(prev => {
      const exists = prev.find(i => i._id === book._id);
      if (exists) {
        return prev.map(i => i._id === book._id ? { ...i, quantity: (i.quantity || 1) + 1 } : i);
      }
      // Ensure price is always a valid number
      const bookWithPrice = {
        ...book,
        price: Number(book.price) || 0,
        quantity: 1,
        addedAt: new Date().toISOString()
      };
      return [...prev, bookWithPrice];
    });
  };

  const removeFromCart = (bookId) => {
    setItems(prev => prev.filter(i => i._id !== bookId));
  };

  const updateQuantity = (bookId, qty) => {
    if (qty < 1) { removeFromCart(bookId); return; }
    setItems(prev => prev.map(i => i._id === bookId ? { ...i, quantity: qty } : i));
  };

  const isInCart = (bookId) => items.some(i => i._id === bookId);
  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + (i.quantity || 1), 0);
  const totalPrice = items.reduce((sum, i) => sum + ((i.price || 0) * (i.quantity || 1)), 0);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity,
      isInCart, clearCart,
      count: totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
};
