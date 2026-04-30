import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Image, Clock, DollarSign, FileText, Tag, AlertCircle, Info } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';
import { useContract } from '../hooks/useContract';
import { auctionClient } from '../lib/contract';
import TxStatusModal from '../components/TxStatusModal';

interface FormData {
  itemName: string;
  description: string;
  imageUrl: string;
  startingPriceXlm: string;
  durationHours: string;
}

export default function CreateAuction() {
  const navigate = useNavigate();
  const { wallet, isConnected, connect } = useWallet();
  const { txState, execute, reset } = useContract();

  const [form, setForm] = useState<FormData>({
    itemName: '',
    description: '',
    imageUrl: '',
    startingPriceXlm: '10',
    durationHours: '24',
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});

  const validate = (): boolean => {
    const errs: Partial<FormData> = {};
    if (!form.itemName.trim()) errs.itemName = 'Item name is required';
    if (form.itemName.length > 64) errs.itemName = 'Max 64 characters';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.startingPriceXlm || parseFloat(form.startingPriceXlm) < 0.1)
      errs.startingPriceXlm = 'Minimum starting price is 0.1 XLM';
    if (!form.durationHours || parseFloat(form.durationHours) < 1 || parseFloat(form.durationHours) > 168)
      errs.durationHours = 'Duration must be 1–168 hours (1 week max)';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConnected || !wallet) { connect(); return; }
    if (!validate()) return;

    const result = await execute(
      async () => {
        const { txHash } = await auctionClient.createAuction({
          creator: wallet.address,
          itemName: form.itemName.trim(),
          description: form.description.trim(),
          startingPriceXlm: parseFloat(form.startingPriceXlm),
          durationHours: parseFloat(form.durationHours),
          signTransaction: async (xdr) => {
            const { getWalletKit } = await import('../lib/wallet');
            const { NETWORK_CONFIG } = await import('../lib/stellar');
            const kit = getWalletKit();
            const { signedTxXdr } = await kit.signTransaction(xdr, {
              networkPassphrase: NETWORK_CONFIG.networkPassphrase,
            });
            return signedTxXdr;
          },
        });
        return txHash;
      },
      {
        pendingMessage: 'Creating your auction on Stellar Testnet…',
        successMessage: 'Auction created successfully! Redirecting…',
      }
    );

    if (result) {
      setTimeout(() => { 
        navigate('/', { state: { refresh: true } }); 
      }, 3000);
    }
  };

  const field = (
    key: keyof FormData,
    label: string,
    icon: React.ReactNode,
    type = 'text',
    placeholder = '',
    hint = ''
  ) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1.5" htmlFor={`field-${key}`}>
        <span className="flex items-center gap-1.5">
          {icon}
          {label}
        </span>
      </label>
      {key === 'description' ? (
        <textarea
          id={`field-${key}`}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          rows={3}
          className={`input-field resize-none ${errors[key] ? 'border-rose-500/50' : ''}`}
        />
      ) : (
        <input
          id={`field-${key}`}
          type={type}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          placeholder={placeholder}
          className={`input-field ${errors[key] ? 'border-rose-500/50' : ''}`}
          step={type === 'number' ? '0.1' : undefined}
        />
      )}
      {hint && !errors[key] && (
        <p className="text-xs text-slate-600 mt-1 flex items-center gap-1">
          <Info size={10} /> {hint}
        </p>
      )}
      {errors[key] && (
        <p className="text-xs mt-1 flex items-center gap-1" style={{ color: '#fb7185' }}>
          <AlertCircle size={10} /> {errors[key]}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen py-10 px-4">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-white mb-2">Create Auction</h1>
          <p className="text-slate-400 text-sm">
            List your item on the Stellar blockchain — trustless, transparent, and permanent.
          </p>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-5"
          style={{ background: 'rgba(22,27,39,0.7)', border: '1px solid rgba(139,92,246,0.15)' }}>

          {field('itemName', 'Item Name', <Tag size={13} />, 'text', 'e.g. Stellar NFT #001', 'Max 64 characters')}
          {field('description', 'Description', <FileText size={13} />, 'textarea', 'Describe your item, its rarity, provenance…')}
          {field('imageUrl', 'Image URL (optional)', <Image size={13} />, 'url', 'https://…', 'Direct link to JPG, PNG, or GIF')}

          <div className="grid grid-cols-2 gap-4">
            {field('startingPriceXlm', 'Starting Price (XLM)', <DollarSign size={13} />, 'number', '10', 'Min 0.1 XLM')}
            {field('durationHours', 'Duration (hours)', <Clock size={13} />, 'number', '24', '1–168 hours')}
          </div>

          {/* Preview */}
          {form.itemName && (
            <div className="p-3 rounded-xl text-sm animate-fade-in"
              style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.12)' }}>
              <p className="text-slate-400 text-xs mb-1">Preview</p>
              <p className="font-bold text-white">{form.itemName}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Starting at {form.startingPriceXlm} XLM · Duration: {form.durationHours}h
              </p>
            </div>
          )}

          {/* Submit */}
          {isConnected ? (
            <button
              type="submit"
              id="create-auction-submit"
              disabled={txState.status === 'pending'}
              className="btn-primary w-full justify-center text-base py-3.5"
            >
              <Plus size={18} />
              Create Auction on Stellar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => connect()}
              className="btn-secondary w-full justify-center text-base py-3.5"
            >
              Connect Wallet to Continue
            </button>
          )}

          <p className="text-xs text-slate-600 text-center">
            Transaction fees ≈ 0.001 XLM · Stellar Testnet only
          </p>
        </form>
      </div>

      <TxStatusModal
        txState={txState}
        onClose={reset}
        title="Creating Auction"
      />
    </div>
  );
}
