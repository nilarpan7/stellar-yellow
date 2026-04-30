import { AlertTriangle } from 'lucide-react';

export default function DemoBanner() {
  const contractAddress = import.meta.env.VITE_CONTRACT_ADDRESS;
  
  if (contractAddress) return null;
  
  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 py-2 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
        <AlertTriangle size={16} className="text-amber-400" />
        <span className="text-amber-200">
          Demo Mode: No contract deployed. All data is simulated.
        </span>
      </div>
    </div>
  );
}
