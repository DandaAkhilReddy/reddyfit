// User & Authentication Types
export type UserRole = 'admin' | 'player' | 'scorer';

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  playerId?: string; // Link to player document
  displayName: string;
  photoURL?: string; // From Google/Firebase Auth
  createdAt: Date;
}

// Player Types
export type BattingHand = 'Right' | 'Left';
export type PlayerRole = 'Batsman' | 'Allrounder' | 'Bowler' | 'WK-Batsman';
export type PlayerPosition =
  | 'Principal'
  | 'Director'
  | 'Captain'
  | 'Vice Captain'
  | 'Associate VC'
  | 'Quality Director'
  | 'Player';

export interface PlayerStats {
  matchesPlayed: number;
  runs: number;
  wickets: number;
  catches: number;
  stumpings?: number;
  battingAverage: number;
  bowlingAverage?: number;
  strikeRate: number;
  economy?: number;
}

export interface Player {
  id: string;
  userId?: string; // Link to Firebase Auth user
  name: string;
  role: PlayerRole;
  battingHand?: BattingHand;
  position: PlayerPosition;
  photo?: string; // Firebase Storage URL
  bio?: string;
  contact?: {
    phone?: string;
    email?: string;
  };
  stats: PlayerStats;
  equipmentReceived: { practiceTShirt: boolean; matchTShirt: boolean; bat?: boolean; pads?: boolean; gloves?: boolean; helmet?: boolean; shoes?: boolean; kitBag?: boolean; other?: string[]; lastUpdated?: Date; }; // Array of equipment IDs
  availability: boolean; // Available for next match/practice
  attendanceRate: number; // Percentage
  joinedDate: Date;
  isActive: boolean;
}

// Leadership Types
export interface LeadershipMember {
  id: string;
  name: string;
  title: string;
  emoji: string;
  photo?: string;
  bio?: string;
  order: number; // For display ordering
}

// Match Types
export type MatchStatus = 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
export type MatchType = 'League' | 'Tournament' | 'Friendly' | 'Practice Match';

export interface MatchScorecard {
  playerName: string;
  playerId: string;
  runs?: number;
  balls?: number;
  fours?: number;
  sixes?: number;
  wickets?: number;
  overs?: number;
  maidens?: number;
  runsConceded?: number;
  catches?: number;
  stumpings?: number;
}

export interface Match {
  id: string;
  date: Date;
  time: string;
  opponent: string;
  location: string;
  type: MatchType;
  status: MatchStatus;
  result?: 'won' | 'lost' | 'tied' | 'no result';
  ourScore?: string;
  opponentScore?: string;
  playerOfTheMatch?: string; // Player ID
  scorecard: MatchScorecard[];
  photos?: string[]; // Firebase Storage URLs
  budgetSpent: number;
  expenses: {
    category: string;
    amount: number;
    description: string;
  }[];
  notes?: string;
  createdBy: string; // User ID
  createdAt: Date;
  updatedAt: Date;
}

// Practice Types
export type PracticeType = 'Batting' | 'Bowling' | 'Fielding' | 'Fitness' | 'Full Practice';

export interface Practice {
  id: string;
  date: Date;
  time: string;
  duration: number; // minutes
  type: PracticeType;
  location: string;
  attendance: string[]; // Array of player IDs who attended
  notes?: string;
  focusAreas?: string[];
  createdBy: string; // User ID
  createdAt: Date;
}

// Equipment Types
export type EquipmentCategory =
  | 'Bats'
  | 'Balls'
  | 'Protective Gear'
  | 'Team Kit'
  | 'Training Equipment'
  | 'Other';

export type EquipmentCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Needs Replacement';

export interface Equipment {
  id: string;
  name: string;
  category: EquipmentCategory;
  brand?: string;
  quantity: number;
  condition: EquipmentCondition;
  assignedTo?: string; // Player ID (if personal equipment)
  purchaseDate: Date;
  cost: number;
  vendor?: string;
  maintenanceLog: {
    date: Date;
    description: string;
    cost: number;
  }[];
  photo?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Budget & Finance Types
export type ExpenseCategory =
  | 'Equipment'
  | 'Ground Fees'
  | 'Travel'
  | 'Tournament Fees'
  | 'Food & Beverages'
  | 'Team Kit'
  | 'Miscellaneous';

export interface Expense {
  id: string;
  date: Date;
  category: ExpenseCategory;
  amount: number;
  description: string;
  receipt?: string; // Firebase Storage URL
  matchId?: string; // Link to match if match-related
  approvedBy?: string; // User ID
  createdBy: string; // User ID
  createdAt: Date;
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  remaining: number;
  categoryBreakdown: {
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }[];
  monthlySpending: {
    month: string;
    amount: number;
  }[];
}

// Announcement Types
export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string; // User ID
  authorName: string;
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Communication Types
export interface Message {
  id: string;
  content: string;
  author: string; // User ID
  authorName: string;
  authorPhoto?: string;
  createdAt: Date;
}

// Sponsor Types
export interface Sponsor {
  id: string;
  name: string;
  logo?: string;
  description: string;
  website?: string;
  contactPerson: string;
  sponsorshipAmount: number;
  sponsorshipType: 'Title Sponsor' | 'Main Sponsor' | 'Associate Sponsor';
  startDate: Date;
  endDate?: Date;
  isActive: boolean;
}
