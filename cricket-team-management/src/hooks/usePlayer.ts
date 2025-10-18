import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getPlayerByEmail, updatePlayer } from '../services/playerService';
import type { Player } from '../types/player';

export function usePlayerProfile() {
  const [player, setPlayer] = useState<Player | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!currentUser?.email) {
      setLoading(false);
      return;
    }

    const fetchPlayer = async () => {
      try {
        const playerData = await getPlayerByEmail(currentUser.email);
        if (playerData) {
          setPlayer(playerData);
        } else {
          setError('Player profile not found. Contact admin.');
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPlayer();
  }, [currentUser]);

  return { player, loading, error };
}

export function useSubmitUpdate() {
  const [submitting, setSubmitting] = useState(false);
  const { currentUser } = useAuth();

  const submitUpdate = async (player: Player, changes: Partial<Player>) => {
    if (!currentUser) throw new Error('Not authenticated');

    setSubmitting(true);
    try {
      const updatedPlayer = { ...player, ...changes };
      await updatePlayer(updatedPlayer);
    } finally {
      setSubmitting(false);
    }
  };

  return { submitUpdate, submitting };
}
