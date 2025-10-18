import { z } from 'zod';

// Equipment Validation
export const EquipmentSchema = z.object({
  practiceTShirt: z.boolean(),
  matchTShirt: z.boolean(),
  cap: z.boolean(),
  practiceTShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).nullable(),
  matchTShirtSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']).nullable(),
  capSize: z.enum(['S', 'M', 'L']).nullable(),
});

// Player Validation
export const PlayerSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().min(1),
  fullName: z.string().min(1),
  age: z.number().int().min(10).max(100),
  battingStyle: z.enum(['Right-hand bat', 'Left-hand bat', 'NA']),
  bowlingStyle: z.enum(['Right-arm', 'Left-arm', 'NA']),
  roleType: z.enum(['Batsman', 'Bowler', 'All-Rounder', 'Wicket-Keeper']),
  equipmentApproved: EquipmentSchema,
  lastApprovedBy: z.string().nullable(),
  lastApprovedAt: z.number().nullable(),
  photoURL: z.string().optional(),
  isActive: z.boolean(),
});

// Score Schema (for OCR/LLM parsing)
export const ScoreSchema = z.object({
  teams: z.array(z.object({
    name: z.string(),
    innings: z.array(z.object({
      runs: z.number(),
      wickets: z.number(),
      overs: z.string(),
    })),
  })),
  toss: z.string(),
  result: z.string(),
  topPerformers: z.array(z.object({
    player: z.string(),
    batting: z.string().nullable(),
    bowling: z.string().nullable(),
  })),
  manOfTheMatch: z.string(),
  fallOfWickets: z.string().optional(),
  extras: z.string().optional(),
  notes: z.string().optional(),
});

// Diff generator for approval queue
export function generateDiff(before: any, after: any): any {
  const changes: any = {};
  for (const key in after) {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      changes[key] = { before: before[key], after: after[key] };
    }
  }
  return changes;
}

export type Equipment = z.infer<typeof EquipmentSchema>;
export type Player = z.infer<typeof PlayerSchema>;
export type Score = z.infer<typeof ScoreSchema>;
