import { Clock, Trophy, Target, Wallet, Ban, Settings, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Sidebar() {
  return (
    <div className="fixed left-0 top-0 h-screen w-16 bg-blue-600 flex flex-col items-center py-4 space-y-8">
      <div className="text-white">
        <Menu className="w-6 h-6" />
      </div>
      
      <nav className="flex-1 flex flex-col items-center space-y-6">
        <Link to="/" className="text-white/80 hover:text-white transition-colors">
          <Clock className="w-6 h-6" />
        </Link>
        <Link to="/bills" className="text-white/80 hover:text-white transition-colors">
          <Trophy className="w-6 h-6" />
        </Link>
        <Link to="/add-bill" className="text-white/80 hover:text-white transition-colors">
          <Target className="w-6 h-6" />
        </Link>
        <Link to="/allocations" className="text-white/80 hover:text-white transition-colors">
          <Wallet className="w-6 h-6" />
        </Link>
        <Link to="/allocate" className="text-white/80 hover:text-white transition-colors">
          <Ban className="w-6 h-6" />
        </Link>
      </nav>

      <button className="text-white/80 hover:text-white transition-colors">
        <Settings className="w-6 h-6" />
      </button>
    </div>
  );
}

