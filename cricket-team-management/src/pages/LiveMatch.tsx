import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { LiveMatch as LiveMatchType } from '../types/scoring';
import ScoreBoard from '../components/scoring/ScoreBoard';
import { Activity, Clock, TrendingUp, Target } from 'lucide-react';
import Badge from '../components/Badge';
import Card from '../components/Card';

export default function LiveMatch() {
  const { id } = useParams<{ id: string }>();
  const [liveMatch, setLiveMatch] = useState<LiveMatchType | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  useEffect(() => {
    if (!id) return;

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      doc(db, 'matches', id, 'live', 'current'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as LiveMatchType;
          setLiveMatch(data);
          setLastUpdate(new Date());
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error listening to live match:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading live match...</p>
        </div>
      </div>
    );
  }

  if (!liveMatch) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="p-8 bg-gray-800 text-center max-w-md">
          <Activity className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-bold text-white mb-2">
            Match Not Live
          </h2>
          <p className="text-gray-400">
            This match hasn't started yet or has finished
          </p>
        </Card>
      </div>
    );
  }

  const innings = liveMatch.currentInnings === 'first' ? liveMatch.firstInnings : liveMatch.secondInnings!;

  return (
    <div className="min-h-screen bg-gray-900">
      {/* ScoreBoard */}
      <ScoreBoard liveMatch={liveMatch} />

      {/* Match Details & Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Last Update */}
        <div className="flex items-center justify-between text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
          </div>
          <Badge variant="success" className="animate-pulse">
            <Activity className="w-3 h-3 inline mr-1" />
            LIVE
          </Badge>
        </div>

        {/* Batsmen Stats */}
        {innings.batsmen && innings.batsmen.length > 0 && (
          <Card className="p-6 bg-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">Batting</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr className="text-gray-400 text-left">
                    <th className="pb-2">Batsman</th>
                    <th className="pb-2 text-center">R</th>
                    <th className="pb-2 text-center">B</th>
                    <th className="pb-2 text-center">4s</th>
                    <th className="pb-2 text-center">6s</th>
                    <th className="pb-2 text-center">SR</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {innings.batsmen.map((batsman) => (
                    <tr key={batsman.playerId} className="border-b border-gray-700/50">
                      <td className="py-3">
                        {batsman.playerName}
                        {batsman.isOnStrike && (
                          <span className="ml-2 text-yellow-400">*</span>
                        )}
                      </td>
                      <td className="text-center font-semibold">{batsman.runs}</td>
                      <td className="text-center text-gray-400">{batsman.balls}</td>
                      <td className="text-center text-gray-400">{batsman.fours}</td>
                      <td className="text-center text-gray-400">{batsman.sixes}</td>
                      <td className="text-center text-gray-400">{batsman.strikeRate.toFixed(1)}</td>
                      <td className="text-gray-400">
                        {batsman.isOut ? (
                          <span className="text-red-400">
                            {batsman.dismissal?.type}
                            {batsman.dismissal?.bowlerName && ` b ${batsman.dismissal.bowlerName}`}
                          </span>
                        ) : (
                          <span className="text-green-400">Batting</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Bowlers Stats */}
        {innings.bowlers && innings.bowlers.length > 0 && (
          <Card className="p-6 bg-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">Bowling</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-700">
                  <tr className="text-gray-400 text-left">
                    <th className="pb-2">Bowler</th>
                    <th className="pb-2 text-center">O</th>
                    <th className="pb-2 text-center">M</th>
                    <th className="pb-2 text-center">R</th>
                    <th className="pb-2 text-center">W</th>
                    <th className="pb-2 text-center">Econ</th>
                  </tr>
                </thead>
                <tbody className="text-white">
                  {innings.bowlers.map((bowler) => (
                    <tr key={bowler.playerId} className="border-b border-gray-700/50">
                      <td className="py-3">
                        {bowler.playerName}
                        {bowler.isCurrentlyBowling && (
                          <span className="ml-2 text-yellow-400">*</span>
                        )}
                      </td>
                      <td className="text-center">{bowler.overs}</td>
                      <td className="text-center text-gray-400">{bowler.maidens}</td>
                      <td className="text-center">{bowler.runs}</td>
                      <td className="text-center font-semibold">{bowler.wickets}</td>
                      <td className="text-center text-gray-400">{bowler.economy.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Fall of Wickets */}
        {innings.fallOfWickets && innings.fallOfWickets.length > 0 && (
          <Card className="p-6 bg-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">Fall of Wickets</h3>
            <div className="flex flex-wrap gap-4">
              {innings.fallOfWickets.map((fow) => (
                <div key={fow.wicketNumber} className="text-sm">
                  <div className="text-gray-400">
                    {fow.teamScore}-{fow.wicketNumber}
                  </div>
                  <div className="text-white font-semibold">
                    {fow.playerName} ({fow.runs})
                  </div>
                  <div className="text-xs text-gray-500">
                    Ov {fow.overNumber}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Last Over */}
        {innings.lastOver && innings.lastOver.length > 0 && (
          <Card className="p-6 bg-gray-800">
            <h3 className="text-lg font-bold text-white mb-4">Last Over</h3>
            <div className="flex gap-2 flex-wrap">
              {innings.lastOver.map((ball, idx) => (
                <div
                  key={idx}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold ${
                    ball.isWicket
                      ? 'bg-red-500 text-white'
                      : ball.totalRuns >= 6
                      ? 'bg-purple-500 text-white'
                      : ball.totalRuns >= 4
                      ? 'bg-green-500 text-white'
                      : ball.totalRuns > 0
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-600 text-white'
                  }`}
                >
                  {ball.isWicket ? 'W' : ball.totalRuns}
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
