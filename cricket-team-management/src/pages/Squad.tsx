import { useState } from 'react';
import { Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import { initialPlayers } from '../data/players';

export default function Squad() {
  const [filterRole, setFilterRole] = useState<string>('All');
  
  const roles = ['All', 'Captain', 'Vice Captain', 'Associate VC', 'Quality Director', 'Player'];
  
  const filteredPlayers = filterRole === 'All' 
    ? initialPlayers 
    : initialPlayers.filter(p => p.position === filterRole);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-amber-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-10 h-10 text-green-700" />
            <h1 className="text-4xl font-bold text-gray-800">Team Roster</h1>
          </div>
          <p className="text-gray-600 text-lg">Islanders Cricket Club - Corpus Christi, Texas</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <p className="text-sm font-semibold text-gray-600 mb-3">Filter by Role:</p>
          <div className="flex flex-wrap gap-2">
            {roles.map(role => (
              <button key={role} onClick={() => setFilterRole(role)} className={filterRole === role ? 'bg-green-700 text-white px-4 py-2 rounded-lg font-medium' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg font-medium'}>
                {role}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlayers.map((player, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              <div className="bg-gradient-to-r from-green-700 to-green-600 p-6 text-white">
                <h3 className="text-2xl font-bold mb-1">{player.name}</h3>
                <p className="text-green-100 text-sm">{player.position}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="bg-green-900 px-3 py-1 rounded-full text-xs font-semibold">{player.role}</span>
                  {player.battingHand && <span className="bg-green-900 px-3 py-1 rounded-full text-xs">{player.battingHand} Hand</span>}
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 text-sm mb-4">{player.bio}</p>
                <div className="border-t pt-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-5 h-5 text-gray-600" />
                    <p className="font-semibold text-gray-800">Equipment Status</p>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Practice T-Shirt:</span>
                      <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" />Not Received</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Match T-Shirt:</span>
                      <span className="flex items-center gap-1 text-gray-400"><XCircle className="w-4 h-4" />Not Received</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-3 italic">Players can update after logging in</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 bg-green-800 text-white p-6 rounded-lg text-center">
          <p className="text-lg">Players: Log in to update your equipment status and profile</p>
        </div>
      </div>
    </div>
  );
}
