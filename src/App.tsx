import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateAuction from './pages/CreateAuction';
import AuctionDetail from './pages/AuctionDetail';
import MyAuctions from './pages/MyAuctions';
import NotFound from './pages/NotFound';
import { CustomCursor, BrutalistBackground } from './components/LooComponents';
import { WalletProvider } from './contexts/WalletContext';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useEffect(() => {
    const lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
        lenis.destroy();
        gsap.ticker.remove(lenis.raf);
    }
  }, []);

  return (
    <WalletProvider>
    <BrowserRouter>
      <ScrollToTop />
      <div className="bg-zinc-950 min-h-screen text-zinc-100 selection:bg-lime-400 selection:text-black cursor-none flex flex-col">
        <CustomCursor />
        <BrutalistBackground />
        <Navbar />
        <main className="flex-1 relative z-10">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/create" element={<CreateAuction />} />
            <Route path="/auction/:id" element={<AuctionDetail />} />
            <Route path="/my-auctions" element={<MyAuctions />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(22, 27, 39, 0.95)',
            color: '#e2e8f0',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
          },
          success: {
            iconTheme: { primary: '#34d399', secondary: '#0f1117' },
          },
        }}
      />
    </BrowserRouter>
    </WalletProvider>
  );
}
