import React from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/layout/Header';

export default function NotFoundPage() {
  return (
    <div style={{ background: 'var(--bg-primary)', minHeight: '100vh' }}>
      <Header />
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', minHeight: '100vh', textAlign: 'center', padding: 20
      }}>
        <div style={{ fontSize: 80, marginBottom: 20 }}>📚</div>
        <h1 style={{
          fontFamily: 'Cormorant Garamond, serif',
          fontSize: 'clamp(80px, 15vw, 160px)',
          fontWeight: 300, color: 'var(--gold)', lineHeight: 1, marginBottom: 8
        }}>404</h1>
        <h2 style={{
          fontFamily: 'Cormorant Garamond, serif', fontSize: 28,
          fontWeight: 300, color: 'var(--text-primary)', marginBottom: 16
        }}>Page Not Found</h2>
        <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 36, maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 28px', background: 'var(--gold)', color: '#000',
          fontSize: 12, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
          textDecoration: 'none', borderRadius: 4
        }}>← Back to Home</Link>
      </div>
    </div>
  );
}