import type { LiveMatch } from '../../types/scoring';
import { TrendingUp, Activity } from 'lucide-react';
import Badge from '../Badge';

interface ScoreBoardProps {
  liveMatch: LiveMatch;
}

export default function ScoreBoard({ liveMatch }: ScoreBoardProps) {
  const innings = liveMatch.currentInnings === 'first' ? liveMatch.firstInnings : liveMatch.secondInnings!;

  function formatOvers(balls: number): string {
    const overs = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    return `${overs}.${ballsInOver}`;
  }

  return (
    <div className="bg-gradient-to-r from-island-blue-600 to-cricket-green-600 text-white">
      {/* Live Badge */}
      <div className="px-4 pt-4 flex justify-between items-center">
        <Badge variant="error" className="animate-pulse">
          <Activity className="w-3 h-3 inline mr-1" />
          LIVE
        </Badge>
        <div className="text-sm text-white/80">{liveMatch.venue}</div>
      </div>

      {/* Main Score */}
      <div className="px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold">{innings.battingTeam}</h2>
            <p className="text-white/80 text-sm">{liveMatch.matchType} • {liveMatch.totalOvers} overs</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold">
              {innings.runs}/{innings.wickets}
            </div>
            <div className="text-lg text-white/90">
              ({formatOvers(innings.balls)} overs)
            </div>
          </div>
        </div>

        {/* Run Rate */}
        <div className="flex items-center gap-4 text-sm bg-white/10 backdrop-blur-sm rounded-lg p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span>CRR: {innings.runRate.toFixed(2)}</span>
          </div>
          {innings.target && (
            <>
              <div className="w-px h-4 bg-white/30"></div>
              <div>
                Target: {innings.target}
              </div>
              {innings.requiredRunRate && (
                <>
                  <div className="w-px h-4 bg-white/30"></div>
                  <div>
                    RRR: {innings.requiredRunRate.toFixed(2)}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Current Batsmen */}
      {innings.currentBatsmen?.striker && innings.currentBatsmen?.nonStriker && (
        <div className="bg-black/20 backdrop-blur-sm px-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Striker */}
            <div className="relative">
              <div className="absolute -top-2 -left-2">
                <div className="w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center text-black font-bold text-xs">
                  *
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-3">
                <div className="font-semibold text-sm mb-1">
                  {innings.currentBatsmen.striker.playerName}
                </div>
                <div className="text-2xl font-bold">
                  {innings.currentBatsmen.striker.runs}
                </div>
                <div className="text-xs text-white/70">
                  ({innings.currentBatsmen.striker.balls}) • SR: {innings.currentBatsmen.striker.strikeRate.toFixed(1)}
                </div>
              </div>
            </div>

            {/* Non-striker */}
            <div className="bg-white/10 rounded-lg p-3">
              <div className="font-semibold text-sm mb-1">
                {innings.currentBatsmen.nonStriker.playerName}
              </div>
              <div className="text-2xl font-bold">
                {innings.currentBatsmen.nonStriker.runs}
              </div>
              <div className="text-xs text-white/70">
                ({innings.currentBatsmen.nonStriker.balls}) • SR: {innings.currentBatsmen.nonStriker.strikeRate.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Bowler */}
      {innings.currentBowler && (
        <div className="bg-black/20 backdrop-blur-sm px-4 py-3 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-white/70 mb-1">Bowling</div>
              <div className="font-semibold">{innings.currentBowler.playerName}</div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">
                {innings.currentBowler.wickets}-{innings.currentBowler.runs}
              </div>
              <div className="text-xs text-white/70">
                ({innings.currentBowler.overs} ov) • Econ: {innings.currentBowler.economy.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Current Over */}
      {innings.currentOver.length > 0 && (
        <div className="px-4 py-3 bg-black/30">
          <div className="text-xs text-white/70 mb-2">This Over</div>
          <div className="flex gap-2 flex-wrap">
            {innings.currentOver.map((ball, idx) => (
              <div
                key={idx}
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
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
        </div>
      )}
    </div>
  );
}
