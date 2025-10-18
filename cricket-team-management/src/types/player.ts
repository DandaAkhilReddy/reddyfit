import type { PlayerEquipment, EquipmentItem, TShirtSize, CapSize } from './equipment';

export type UserRole = 'admin' | 'player';
export type BattingStyle = 'Right-hand bat' | 'Left-hand bat' | 'NA';
export type BowlingStyle = 'Right-arm' | 'Left-arm' | 'NA';
export type RoleType = 'Batsman' | 'Bowler' | 'All-Rounder' | 'Wicket-Keeper';

export interface Player {
  id: string;
  email: string;
  name: string;
  fullName: string;
  age: number;
  battingStyle: BattingStyle;
  bowlingStyle: BowlingStyle;
  roleType: RoleType;
  equipmentReceived: PlayerEquipment;
  photoURL?: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PlayerUpdateRequest {
  id: string;
  playerId: string;
  submittedBy: string;
  submittedAt: number;
  changes: {
    equipmentReceived?: Partial<PlayerEquipment>;
    name?: string;
    fullName?: string;
    age?: number;
    battingStyle?: BattingStyle;
    bowlingStyle?: BowlingStyle;
    roleType?: RoleType;
  };
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy: string | null;
  reviewedAt: number | null;
  reason: string | null;
}

export interface User {
  uid: string;
  email: string;
  role: UserRole;
  displayName: string;
  photoURL?: string;
  createdAt: number;
}

export type { PlayerEquipment, EquipmentItem, TShirtSize, CapSize };
