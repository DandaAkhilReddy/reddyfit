// Live Cricket Scoring Types

export type ExtrasType = 'wide' | 'noball' | 'bye' | 'legbye';
export type WicketType = 'bowled' | 'caught' | 'lbw' | 'runout' | 'stumped' | 'hitwicket' | 'retired';
export type InningsType = 'first' | 'second';

// Individual Ball Data
export interface Ball {
  id: string;
  ballNumber: string; // Format: "0.1", "0.2", etc.
  overNumber: number; // 0, 1, 2, etc.
  ballInOver: number; // 1-6
  runs: number; // Runs scored off the bat
  totalRuns: number; // Including extras
  batsmanId: string;
  batsmanName: string;
  batsmanRuns: number; // Batsman's score after this ball
  bowlerId: string;
  bowlerName: string;
  isWicket: boolean;
  wicket?: {
    type: WicketType;
    dismissedPlayerId: string;
    dismissedPlayerName: string;
    bowlerId?: string; // For bowled, caught, lbw, stumped, hitwicket
    bowlerName?: string;
    fielderId?: string; // For caught, runout
    fielderName?: string;
  };
  extras?: {
    type: ExtrasType;
    runs: number;
  };
  commentary?: string; // Auto-generated or manual commentary
  timestamp: Date;
}

// Live Batsman Stats
export interface LiveBatsman {
  playerId: string;
  playerName: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOnStrike: boolean;
  isOut: boolean;
  dismissal?: {
    type: WicketType;
    bowlerName?: string;
    fielderName?: string;
  };
}

// Live Bowler Stats
export interface LiveBowler {
  playerId: string;
  playerName: string;
  overs: number;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  dots: number; // Dot balls
  isCurrentlyBowling: boolean;
}

// Partnership
export interface Partnership {
  batsman1Id: string;
  batsman1Name: string;
  batsman1Runs: number;
  batsman2Id: string;
  batsman2Name: string;
  batsman2Runs: number;
  runs: number;
  balls: number;
  startBall: number;
  endBall?: number;
  isActive: boolean;
}

// Fall of Wicket
export interface FallOfWicket {
  wicketNumber: number;
  playerId: string;
  playerName: string;
  runs: number; // Individual score
  balls: number;
  teamScore: number; // Team score when wicket fell
  overNumber: number;
  ballNumber: string;
}

// Live Innings
export interface LiveInnings {
  inningsNumber: InningsType;
  battingTeam: string; // "Islanders" or opponent name
  bowlingTeam: string;
  runs: number;
  wickets: number;
  overs: number;
  balls: number; // Total balls bowled
  runRate: number; // Current run rate
  target?: number; // Target to chase (for second innings)
  requiredRunRate?: number; // Required run rate (for second innings)
  batsmen: LiveBatsman[]; // All batsmen (including dismissed)
  currentBatsmen: {
    striker: LiveBatsman;
    nonStriker: LiveBatsman;
  };
  bowlers: LiveBowler[]; // All bowlers who bowled
  currentBowler: LiveBowler;
  partnerships: Partnership[];
  currentPartnership: Partnership;
  fallOfWickets: FallOfWicket[];
  ballByBall: Ball[]; // All balls in innings
  currentOver: Ball[]; // Balls in current over
  lastOver: Ball[]; // Previous over
  extras: {
    wides: number;
    noBalls: number;
    byes: number;
    legByes: number;
    total: number;
  };
  isComplete: boolean;
}

// Live Match State
export interface LiveMatch {
  matchId: string;
  isLive: boolean;
  status: 'not_started' | 'in_progress' | 'innings_break' | 'completed';

  // Match Details
  homeTeam: string; // "Islanders"
  awayTeam: string; // Opponent name
  venue: string;
  matchDate: Date;
  matchType: 'T20' | 'T10' | 'ODI' | 'Test'; // Format
  totalOvers: number; // 20 for T20, 10 for T10, etc.

  // Toss
  tossWonBy: string; // Team name
  tossDecision: 'bat' | 'bowl';

  // Playing XI
  homeTeamPlayers: {
    playerId: string;
    playerName: string;
    role: string;
    battingOrder?: number;
  }[];
  awayTeamPlayers: {
    playerId: string;
    playerName: string;
    role: string;
    battingOrder?: number;
  }[];

  // Innings
  currentInnings: InningsType;
  firstInnings: LiveInnings;
  secondInnings?: LiveInnings;

  // Result
  result?: {
    winner: string; // Team name
    winBy: string; // "5 wickets", "30 runs", etc.
    playerOfTheMatch?: {
      playerId: string;
      playerName: string;
    };
  };

  // Scorer Info
  scorerId: string;
  scorerName: string;
  lastUpdate: Date;

  // Connection Status
  isConnected: boolean; // Real-time connection status
}

// Scoring Action (for undo/redo)
export interface ScoringAction {
  id: string;
  type: 'ball' | 'wicket' | 'bowler_change' | 'innings_end';
  timestamp: Date;
  data: any; // The action data
  canUndo: boolean;
}

// Match Setup (before starting)
export interface MatchSetup {
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  venue: string;
  matchType: 'T20' | 'T10' | 'ODI';
  totalOvers: number;
  tossWonBy: string;
  tossDecision: 'bat' | 'bowl';
  homeTeamPlayers: string[]; // Player IDs
  awayTeamPlayers: {
    name: string;
    role: string;
  }[];
}
