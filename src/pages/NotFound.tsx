import { Link } from 'react-router-dom';
import { Home, Gavel } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-black text-purple-500/20 mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-2">Page Not Found</h2>
        <p className="text-slate-400 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link to="/" className="btn-primary">
            <Home size={16} />
            Go Home
          </Link>
          <Link to="/" className="btn-secondary">
            <Gavel size={16} />
            View Auctions
          </Link>
        </div>
      </div>
    </div>
  );
}
