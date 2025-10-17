import { useState } from 'react';
import type { LiveMatch, Ball, ExtrasType, WicketType } from '../../types/scoring';
import { Undo, RotateCcw, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface ScoringPanelProps {
  liveMatch: LiveMatch;
  onRecordBall: (ball: Omit<Ball, 'id' | 'timestamp'>) => Promise<void>;
}

export default function ScoringPanel({ liveMatch, onRecordBall }: ScoringPanelProps) {
  const [selectedExtras, setSelectedExtras] = useState<{type: ExtrasType; runs: number} | null>(null);
  const [showWicketModal, setShowWicketModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  const innings = liveMatch.currentInnings === 'first' ? liveMatch.firstInnings : liveMatch.secondInnings!;

  async function recordRuns(runs: number) {
    if (isRecording) return;

    setIsRecording(true);

    try {
      const ball: Omit<Ball, 'id' | 'timestamp'> = {
        ballNumber: `${innings.overs}.${(innings.balls % 6) + 1}`,
        overNumber: Math.floor(innings.balls / 6),
        ballInOver: (innings.balls % 6) + 1,
        runs,
        totalRuns: runs + (selectedExtras?.runs || 0),
        batsmanId: innings.currentBatsmen?.striker?.playerId || '',
        batsmanName: innings.currentBatsmen?.striker?.playerName || '',
        batsmanRuns: (innings.currentBatsmen?.striker?.runs || 0) + runs,
        bowlerId: innings.currentBowler?.playerId || '',
        bowlerName: innings.currentBowler?.playerName || '',
        isWicket: false,
        extras: selectedExtras || undefined,
      };

      await onRecordBall(ball);
      setSelectedExtras(null);
    } catch (error) {
      console.error('Error recording ball:', error);
    } finally {
      setIsRecording(false);
    }
  }

  async function recordWicket(wicketType: WicketType, fielderId?: string, fielderName?: string) {
    if (isRecording) return;

    setIsRecording(true);

    try {
      const ball: Omit<Ball, 'id' | 'timestamp'> = {
        ballNumber: `${innings.overs}.${(innings.balls % 6) + 1}`,
        overNumber: Math.floor(innings.balls / 6),
        ballInOver: (innings.balls % 6) + 1,
        runs: 0,
        totalRuns: 0,
        batsmanId: innings.currentBatsmen?.striker?.playerId || '',
        batsmanName: innings.currentBatsmen?.striker?.playerName || '',
        batsmanRuns: innings.currentBatsmen?.striker?.runs || 0,
        bowlerId: innings.currentBowler?.playerId || '',
        bowlerName: innings.currentBowler?.playerName || '',
        isWicket: true,
        wicket: {
          type: wicketType,
          dismissedPlayerId: innings.currentBatsmen?.striker?.playerId || '',
          dismissedPlayerName: innings.currentBatsmen?.striker?.playerName || '',
          bowlerId: innings.currentBowler?.playerId,
          bowlerName: innings.currentBowler?.playerName,
          fielderId,
          fielderName,
        },
      };

      await onRecordBall(ball);
      setShowWicketModal(false);
    } catch (error) {
      console.error('Error recording wicket:', error);
    } finally {
      setIsRecording(false);
    }
  }

  function selectExtras(type: ExtrasType) {
    if (selectedExtras?.type === type) {
      setSelectedExtras(null);
    } else {
      setSelectedExtras({ type, runs: type === 'wide' || type === 'noball' ? 1 : 0 });
    }
  }

  const runButtons = [0, 1, 2, 3, 4, 6];
  const extrasButtons: { type: ExtrasType; label: string; color: string }[] = [
    { type: 'wide', label: 'WD', color: 'bg-yellow-500' },
    { type: 'noball', label: 'NB', color: 'bg-orange-500' },
    { type: 'bye', label: 'BYE', color: 'bg-gray-500' },
    { type: 'legbye', label: 'LB', color: 'bg-gray-600' },
  ];

  return (
    <div className="bg-gray-800 min-h-[calc(100vh-400px)]">
      {/* Partnership Info */}
      {innings.currentPartnership && (
        <div className="bg-gray-700 px-4 py-3 border-b border-gray-600">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-300">Partnership</div>
            <div className="text-white font-semibold">
              {innings.currentPartnership.runs} runs ({innings.currentPartnership.balls} balls)
            </div>
          </div>
        </div>
      )}

      {/* Extras Selection */}
      {selectedExtras && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-900/30 px-4 py-3 border-b border-yellow-600"
        >
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <span className="text-yellow-200 font-semibold">
              {selectedExtras.type.toUpperCase()} selected - Click runs to add
            </span>
          </div>
        </motion.div>
      )}

      {/* Scoring Panel */}
      <div className="p-4 space-y-4">
        {/* Run Buttons */}
        <div>
          <div className="text-gray-400 text-sm font-semibold mb-3">RUNS</div>
          <div className="grid grid-cols-6 gap-3">
            {runButtons.map((run) => (
              <motion.button
                key={run}
                whileTap={{ scale: 0.95 }}
                onClick={() => recordRuns(run)}
                disabled={isRecording}
                className={`h-16 rounded-lg font-bold text-2xl transition-all ${
                  run === 6
                    ? 'bg-gradient-to-br from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 shadow-purple-500/50'
                    : run === 4
                    ? 'bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-green-500/50'
                    : run === 0
                    ? 'bg-gradient-to-br from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800'
                    : 'bg-gradient-to-br from-island-blue-600 to-island-blue-700 hover:from-island-blue-700 hover:to-island-blue-800 shadow-island-blue-500/50'
                } text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {run}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Extras Buttons */}
        <div>
          <div className="text-gray-400 text-sm font-semibold mb-3">EXTRAS</div>
          <div className="grid grid-cols-4 gap-3">
            {extrasButtons.map(({ type, label, color }) => (
              <motion.button
                key={type}
                whileTap={{ scale: 0.95 }}
                onClick={() => selectExtras(type)}
                className={`h-14 rounded-lg font-bold text-sm transition-all ${color} ${
                  selectedExtras?.type === type
                    ? 'ring-4 ring-white ring-opacity-50 shadow-xl'
                    : 'hover:shadow-lg'
                } text-white`}
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Wicket Button */}
        <div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWicketModal(true)}
            disabled={isRecording}
            className="w-full h-16 rounded-lg font-bold text-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg shadow-red-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            🏏 WICKET
          </motion.button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-700">
          <button
            className="h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            onClick={() => {/* TODO: Swap batsmen */}}
          >
            <RotateCcw className="w-4 h-4" />
            Swap Batsmen
          </button>
          <button
            className="h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors"
            onClick={() => {/* TODO: Change bowler */}}
          >
            <Users className="w-4 h-4" />
            Change Bowler
          </button>
        </div>

        {/* Undo Button */}
        <button
          className="w-full h-12 rounded-lg bg-gray-700 hover:bg-gray-600 text-yellow-400 font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-yellow-600"
          onClick={() => {/* TODO: Undo last ball */}}
        >
          <Undo className="w-4 h-4" />
          Undo Last Ball
        </button>
      </div>

      {/* Wicket Modal */}
      {showWicketModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 rounded-lg p-6 max-w-md w-full"
          >
            <h3 className="text-xl font-bold text-white mb-4">Select Wicket Type</h3>
            <div className="space-y-2">
              {(['bowled', 'caught', 'lbw', 'runout', 'stumped', 'hitwicket'] as WicketType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => recordWicket(type)}
                  className="w-full h-14 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-semibold capitalize transition-colors"
                >
                  {type}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowWicketModal(false)}
              className="w-full h-12 rounded-lg bg-gray-900 hover:bg-gray-700 text-gray-400 font-semibold mt-4 transition-colors"
            >
              Cancel
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
