import { useState } from 'react';
import { User, Mail, Camera } from 'lucide-react';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuthStore } from '../store/useStore';
import { updateUser } from '../lib/api';

const Account = () => {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [email] = useState(user?.email || '');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    setMessage('');

    try {
      const updatedUser = await updateUser({ name });
      setUser(updatedUser);
      setMessage('Profile updated successfully');
    } catch (error) {
      setMessage('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <h2 className="font-orbitron text-lg font-semibold text-white mb-6">Account Settings</h2>

      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center">
            <User className="w-12 h-12 text-white" />
          </div>
          <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center">
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="text-center sm:text-left">
          <h3 className="text-xl font-semibold text-white">{name || 'User'}</h3>
          <p className="text-white/60">{email}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm text-white/70 mb-2">Name</label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="input-field pl-12"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-white/70 mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="email"
              value={email}
              disabled
              className="input-field pl-12 bg-white/5 cursor-not-allowed"
            />
          </div>
          <p className="text-xs text-white/40 mt-2">Email cannot be changed</p>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-sm ${
            message.includes('successfully') 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {message}
          </div>
        )}

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </Card>
  );
};

export default Account;
