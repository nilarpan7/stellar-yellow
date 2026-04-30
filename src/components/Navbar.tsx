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
    <nav className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur-md font-mono">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2 group font-bold tracking-tighter text-white">
          <div className="w-8 h-8 rounded-none flex items-center justify-center bg-lime-400">
            <Zap size={16} className="text-black" />
          </div>
          <span className="text-lg uppercase">
            STELLAR_BID
          </span>
        </Link>

        {/* Nav Links */}
        <div className="hidden sm:flex items-center gap-8 text-sm text-zinc-400">
          {navLinks.map(({ to, label }) => {
            const isActive = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`hover:text-lime-400 transition-colors uppercase tracking-widest ${isActive ? 'text-lime-400' : ''}`}
              >
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
          <div className="fixed top-0 left-0 right-0 bg-zinc-950 border-b border-white/10 shadow-2xl font-mono">
            {/* Header */}
            <div className="flex items-center justify-between px-4 h-16 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-none flex items-center justify-center bg-lime-400">
                  <Zap size={16} className="text-black" />
                </div>
                <span className="font-bold text-lg uppercase tracking-tighter text-white">
                  STELLAR_BID
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
              {navLinks.map(({ to, label }) => {
                const isActive = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block px-4 py-3 rounded-none text-base uppercase tracking-widest font-bold transition-all ${isActive ? 'bg-white/5 text-lime-400' : 'text-zinc-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>

            {/* Wallet Connect in Mobile Menu */}
            <div className="p-4 border-t border-white/10">
              <WalletConnect />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
