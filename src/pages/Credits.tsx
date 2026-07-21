import { useState, useEffect } from 'react';
import { CreditCard, ShoppingCart, History } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useCreditsStore } from '../store/useStore';
import { getCredits } from '../lib/api';

const creditPackages = [
  { amount: 10, price: '$5', popular: false },
  { amount: 50, price: '$20', popular: true },
  { amount: 100, price: '$35', popular: false },
  { amount: 500, price: '$150', popular: false },
];

const Credits = () => {
  const { balance, setBalance } = useCreditsStore();

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const creditsData = await getCredits();
        setBalance(creditsData.balance);
      } catch (error) {
        console.error('Failed to fetch credits:', error);
      }
    };

    fetchCredits();
  }, [setBalance]);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-center gap-3 mb-6">
          <CreditCard className="w-5 h-5 text-cyan-400" />
          <h2 className="font-orbitron text-lg font-semibold text-white">Credit Balance</h2>
        </div>

        <div className="text-center py-8">
          <p className="text-6xl font-bold gradient-text mb-2">{balance}</p>
          <p className="text-white/60">Available credits</p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <span className="text-sm text-white/70">1 credit = 1 image generation</span>
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-6">
          <ShoppingCart className="w-5 h-5 text-cyan-400" />
          <h2 className="font-orbitron text-lg font-semibold text-white">Buy Credits</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {creditPackages.map((pkg) => (
            <button
              key={pkg.amount}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                pkg.popular
                  ? 'border-cyan-500 bg-cyan-500/10 shadow-lg shadow-cyan-500/20'
                  : 'border-white/10 bg-white/5 hover:border-white/30'
              }`}
            >
              <p className="text-2xl font-bold text-white">{pkg.amount}</p>
              <p className="text-sm text-white/60">credits</p>
              <p className="mt-2 text-lg font-semibold gradient-text">{pkg.price}</p>
              {pkg.popular && (
                <span className="inline-block mt-2 px-2 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs">
                  Best Value
                </span>
              )}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <div className="flex items-center gap-3 mb-4">
          <History className="w-5 h-5 text-cyan-400" />
          <h2 className="font-orbitron text-lg font-semibold text-white">Transaction History</h2>
        </div>

        <div className="text-center py-8 text-white/40">
          <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No transaction history</p>
          <p className="text-sm">Your purchase history will appear here</p>
        </div>
      </Card>
    </div>
  );
};

export default Credits;
