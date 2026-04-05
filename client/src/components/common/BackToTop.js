import React, { useState, useEffect } from 'react';

export default function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed',
        bottom: 100,   // moved up — chatbot button is at bottom:28px so this clears it
        right: 32,
        zIndex: 9999,  // above chatbot (9997)
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--gold)',
        color: '#000',
        border: 'none',
        cursor: 'pointer',
        fontSize: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 20px rgba(201,168,76,0.4)',
        transition: 'all 0.3s',
      }}
      title="Back to Top"
      aria-label="Scroll to top"
    >
      ↑
    </button>
  );
}