export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
export type CapSize = 'S' | 'M' | 'L';

export interface EquipmentItem {
  received: boolean;
  size: TShirtSize | CapSize | null;
  date: number | null;
  approvedBy?: string;
}

export interface PlayerEquipment {
  practiceTShirt: EquipmentItem;
  matchTShirt: EquipmentItem;
  cap: EquipmentItem;
}

export interface TeamInventory {
  practiceTShirts: Record<TShirtSize, number>;
  matchTShirts: Record<TShirtSize, number>;
  caps: Record<CapSize, number>;
  lastUpdated: number;
  updatedBy: string;
}

export interface DistributionReport {
  totalPlayers: number;
  practiceTShirtsDistributed: number;
  matchTShirtsDistributed: number;
  capsDistributed: number;
  pendingRequests: number;
}
