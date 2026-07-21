import { useState, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { User, Image, Key, CreditCard, Settings, Sparkles } from 'lucide-react';
import Card from '../components/Card';
import { useAuthStore, useCreditsStore, useGenerationStore } from '../store/useStore';
import { getUser, getCredits, getGenerations } from '../lib/api';
import type { Generation } from '../lib/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalGenerations: 0,
    recentGenerations: [] as Generation[],
  });
  
  const { user } = useAuthStore();
  const { balance, setBalance } = useCreditsStore();
  const { refreshTrigger } = useGenerationStore();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [creditsData, generationsData] = await Promise.all([
          getCredits(),
          getGenerations(1, 5),
        ]);
        
        setBalance(creditsData.balance);
        setStats({
          totalGenerations: generationsData.total,
          recentGenerations: generationsData.data,
        });
      } catch (error) {
        console.error('[Dashboard] Failed to fetch dashboard data:', error);
      }
    };

    if (user) {
      fetchData();
    }
  }, [user, setBalance, refreshTrigger]);

  const navItems = [
    { id: 'account', label: 'Account', icon: User },
    { id: 'history', label: 'History', icon: Image },
    { id: 'api-keys', label: 'API Keys', icon: Key },
    { id: 'credits', label: 'Credits', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen pt-16 pb-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="font-orbitron text-3xl sm:text-4xl font-bold text-white mb-2">
            Dashboard
          </h1>
          <p className="text-white/60">
            Welcome back, {user?.name || user?.email}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.id}
                    to={`/dashboard/${item.id}`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </nav>
            </Card>

            <Card className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className="w-5 h-5 text-cyan-400" />
                <span className="font-orbitron font-semibold text-white">Credits</span>
              </div>
              <p className="text-3xl font-bold gradient-text mb-1">{balance}</p>
              <p className="text-sm text-white/60">Available credits</p>
              <button className="mt-4 w-full py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-purple-500 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/30 transition-all">
                Buy More Credits
              </button>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span className="text-white/60 text-sm">Total Generations</span>
                </div>
                <p className="text-3xl font-bold text-white">{stats.totalGenerations}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-white/60 text-sm">Remaining Credits</span>
                </div>
                <p className="text-3xl font-bold text-white">{balance}</p>
              </Card>
              <Card>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-green-400" />
                  </div>
                  <span className="text-white/60 text-sm">Account Created</span>
                </div>
                <p className="text-lg font-bold text-white">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                </p>
              </Card>
            </div>

            <Card className="mb-6">
              <h2 className="font-orbitron text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Image className="w-5 h-5 text-cyan-400" />
                Recent Generations
              </h2>
              
              {stats.recentGenerations.length > 0 ? (
                <div className="space-y-4">
                  {stats.recentGenerations.slice(0, 5).map((generation) => (
                    <div
                      key={generation.id}
                      className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
                    >
                      <img
                        src={generation.image_url}
                        alt="Generated"
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {generation.prompt}
                        </p>
                        <p className="text-white/40 text-sm">
                          {new Date(generation.created_at).toLocaleString()}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        generation.status === 'succeeded' 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {generation.status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-white/40">
                  <Image className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No recent generations</p>
                  <p className="text-sm">Start generating images to see them here</p>
                </div>
              )}
            </Card>

            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
