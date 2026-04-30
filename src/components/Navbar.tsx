import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Gavel, Plus, User, Zap, Menu, X } from 'lucide-react';
import WalletConnect from './WalletConnect';

export default function Navbar() {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { to: '/', label: 'Auctions', icon: <Gavel size={15} /> },
    { to: '/create', label: 'Create', icon: <Plus size={15} /> },
    { to: '/my-auctions', label: 'My Bids', icon: <User size={15} /> },
  ];

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Close menu on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className="sticky top-0 z-40 border-b" style={{
      background: 'rgba(10, 11, 15, 0.85)',
      backdropFilter: 'blur(16px)',
      borderColor: 'rgba(139, 92, 246, 0.12)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
            <Zap size={16} className="text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">
            <span className="gradient-text">Stellar</span>
            <span className="text-white">Bid</span>
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-1">
          {navLinks.map(({ to, label, icon }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: isActive ? '#a78bfa' : '#94a3b8',
                  background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                }}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="sm:hidden p-2 text-slate-400 hover:text-white transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        {/* Wallet Connect */}
        <div className="hidden sm:block">
          <WalletConnect />
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 right-0 bg-[#161b27] border-b border-purple-500/20 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-slate-700/50">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                  <Zap size={16} className="text-white" />
                </div>
                <span className="font-bold text-lg tracking-tight">
                  <span className="gradient-text">Stellar</span>
                  <span className="text-white">Bid</span>
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X size={20} />
              </button>
            </div>

            {/* Navigation Links */}
            <div className="p-4 space-y-2">
              {navLinks.map(({ to, label, icon }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium transition-all"
                    style={{
                      color: isActive ? '#a78bfa' : '#94a3b8',
                      background: isActive ? 'rgba(139,92,246,0.1)' : 'transparent',
                    }}
                  >
                    {icon}
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Wallet Connect in Mobile Menu */}
            <div className="p-4 border-t border-slate-700/50">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
