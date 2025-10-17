import { useEffect, useState } from 'react';
import { useParams, Navigate, useNavigate } from 'react-router-dom';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import type { Match } from '../../types';
import type { LiveMatch, Ball, LiveInnings, LiveBatsman, LiveBowler } from '../../types/scoring';
import ScoreBoard from '../../components/scoring/ScoreBoard';
import ScoringPanel from '../../components/scoring/ScoringPanel';
import toast, { Toaster } from 'react-hot-toast';

export default function LiveScoring() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { currentUser, isScorer } = useAuth();

  const [match, setMatch] = useState<Match | null>(null);
  const [liveMatch, setLiveMatch] = useState<LiveMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!id) return;

    // Fetch basic match data
    fetchMatch();

    // Set up real-time listener for live match data
    const unsubscribe = onSnapshot(
      doc(db, 'matches', id, 'live', 'current'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data() as LiveMatch;
          setLiveMatch(data);
          setIsInitialized(true);
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

  async function fetchMatch() {
    if (!id) return;

    try {
      const matchDoc = await getDoc(doc(db, 'matches', id));
      if (matchDoc.exists()) {
        setMatch({ id: matchDoc.id, ...matchDoc.data() as Match });
      }
    } catch (error) {
      console.error('Error fetching match:', error);
      toast.error('Failed to load match data');
    }
  }

  async function initializeLiveMatch() {
    if (!match || !id || !currentUser) return;

    try {
      // Create initial live match state
      const initialInnings: LiveInnings = {
        inningsNumber: 'first',
        battingTeam: 'Islanders', // This should come from toss decision
        bowlingTeam: match.opponent,
        runs: 0,
        wickets: 0,
        overs: 0,
        balls: 0,
        runRate: 0,
        batsmen: [],
        currentBatsmen: {} as any, // Will be set when batsmen are selected
        bowlers: [],
        currentBowler: {} as any, // Will be set when bowler is selected
        partnerships: [],
        currentPartnership: {} as any,
        fallOfWickets: [],
        ballByBall: [],
        currentOver: [],
        lastOver: [],
        extras: {
          wides: 0,
          noBalls: 0,
          byes: 0,
          legByes: 0,
          total: 0,
        },
        isComplete: false,
      };

      const liveMatchData: LiveMatch = {
        matchId: id,
        isLive: true,
        status: 'in_progress',
        homeTeam: 'Islanders',
        awayTeam: match.opponent,
        venue: match.location,
        matchDate: match.date,
        matchType: 'T20', // Default, should be configurable
        totalOvers: 20,
        tossWonBy: 'Islanders', // Should come from setup
        tossDecision: 'bat',
        homeTeamPlayers: [],
        awayTeamPlayers: [],
        currentInnings: 'first',
        firstInnings: initialInnings,
        scorerId: currentUser.uid,
        scorerName: currentUser.displayName,
        lastUpdate: new Date(),
        isConnected: true,
      };

      await setDoc(doc(db, 'matches', id, 'live', 'current'), liveMatchData);

      // Update match status to ongoing
      await updateDoc(doc(db, 'matches', id), {
        status: 'ongoing',
      });

      setLiveMatch(liveMatchData);
      setIsInitialized(true);
      toast.success('Match started! Select opening batsmen and bowler.');
    } catch (error) {
      console.error('Error initializing live match:', error);
      toast.error('Failed to start match');
    }
  }

  async function recordBall(ball: Omit<Ball, 'id' | 'timestamp'>) {
    if (!liveMatch || !id) return;

    try {
      // Add ball to Firestore
      const ballWithMetadata = {
        ...ball,
        timestamp: new Date(),
      };

      const ballRef = await addDoc(
        collection(db, 'matches', id, 'live', 'current', 'balls'),
        ballWithMetadata
      );

      // Update live match state
      const updatedInnings = calculateInningsState(liveMatch.firstInnings, {
        ...ballWithMetadata,
        id: ballRef.id,
      });

      await updateDoc(doc(db, 'matches', id, 'live', 'current'), {
        firstInnings: updatedInnings,
        lastUpdate: new Date(),
      });

      toast.success('Ball recorded!');
    } catch (error) {
      console.error('Error recording ball:', error);
      toast.error('Failed to record ball');
    }
  }

  function calculateInningsState(innings: LiveInnings, ball: Ball): LiveInnings {
    // Calculate updated innings state after a ball
    const runs = innings.runs + ball.totalRuns;
    const wickets = innings.wickets + (ball.isWicket ? 1 : 0);
    const balls = innings.balls + 1;
    const overs = Math.floor(balls / 6) + (balls % 6) / 10;

    return {
      ...innings,
      runs,
      wickets,
      balls,
      overs,
      runRate: balls > 0 ? (runs / balls) * 6 : 0,
      ballByBall: [...innings.ballByBall, ball],
      currentOver: [...innings.currentOver, ball],
      // TODO: Update batsmen, bowler stats, partnerships, etc.
    };
  }

  if (!isScorer) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-island-blue-200 border-t-island-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading match...</p>
        </div>
      </div>
    );
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Match not found</p>
          <button
            onClick={() => navigate('/scorer')}
            className="text-island-blue-400 hover:underline"
          >
            Back to Scorer Home
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-800 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Ready to start scoring?
          </h2>
          <p className="text-gray-400 mb-6">
            Initialize the match to start recording balls
          </p>
          <button
            onClick={initializeLiveMatch}
            className="w-full bg-gradient-to-r from-island-blue-500 to-cricket-green-500 text-white font-bold py-4 px-6 rounded-lg hover:shadow-xl transition-shadow"
          >
            Start Match
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Toaster position="top-center" />

      {liveMatch && (
        <>
          <ScoreBoard liveMatch={liveMatch} />
          <ScoringPanel liveMatch={liveMatch} onRecordBall={recordBall} />
        </>
      )}
    </div>
  );
}
