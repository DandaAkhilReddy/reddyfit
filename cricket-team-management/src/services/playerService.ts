import { uploadJSON, downloadJSON, listBlobs } from '../lib/azure';
import type { Player } from '../types/player';

export async function getPlayer(playerId: string): Promise<Player | null> {
  return await downloadJSON<Player>(`players/${playerId}.json`);
}

export async function getAllPlayers(): Promise<Player[]> {
  const blobNames = await listBlobs('players/');
  const players: Player[] = [];

  for (const blobName of blobNames) {
    const player = await downloadJSON<Player>(blobName);
    if (player) {
      players.push(player);
    }
  }

  return players;
}

export async function updatePlayer(player: Player): Promise<void> {
  await uploadJSON(`players/${player.id}.json`, player);
}

export async function getPlayerByEmail(email: string): Promise<Player | null> {
  const players = await getAllPlayers();
  return players.find(p => p.email === email) || null;
}
