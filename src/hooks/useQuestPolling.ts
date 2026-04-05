import { useState, useEffect, useCallback, useRef } from 'react';
import { QuestStatusResponse, Discovery, MapNode } from '@/types';

const MAP_NODES_TEMPLATE: { id: string; emoji: string; label: string; key: string }[] = [
  { id: '1', emoji: '🏰', label: 'Base Camp', key: 'base' },
  { id: '2', emoji: '🎪', label: 'UncommonGoods', key: 'specialty' },
  { id: '3', emoji: '📦', label: 'Amazon', key: 'amazon' },
  { id: '4', emoji: '🤪', label: 'Weird Stores', key: 'niche' },
  { id: '5', emoji: '🔬', label: 'Scoring', key: 'alchemy' },
];

export function useQuestPolling(questId: string | null) {
  const [status, setStatus] = useState<QuestStatusResponse | null>(null);
  const [discoveries, setDiscoveries] = useState<Discovery[]>([]);
  const [mapNodes, setMapNodes] = useState<MapNode[]>(
    MAP_NODES_TEMPLATE.map(n => ({ id: n.id, emoji: n.emoji, label: n.label, status: 'queued' as const }))
  );
  const [thoughts, setThoughts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollStatus = useCallback(async () => {
    if (!questId) return;

    try {
      const statusUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quest-status?questId=${questId}`;
      const response = await fetch(statusUrl, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });

      if (!response.ok) throw new Error('Failed to fetch quest status');
      const statusData: QuestStatusResponse = await response.json();

      setStatus(statusData);
      setError(null);

      setThoughts(statusData.messages?.map(m => m.summary) || []);
      setDiscoveries(statusData.discoveries || []);

      const visited = new Set(statusData.visitedNodes || []);
      const current = statusData.currentNode;

      setMapNodes(MAP_NODES_TEMPLATE.map(n => ({
        id: n.id, emoji: n.emoji, label: n.label,
        status: visited.has(n.key) && n.key !== current ? 'visited' as const
          : n.key === current ? 'active' as const : 'queued' as const,
      })));

      setLoading(false);

      if (statusData.status === 'complete' || statusData.status === 'error') {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    } catch (e) {
      console.error('Quest polling error:', e);
      setError(e instanceof Error ? e.message : 'Polling failed');
      setLoading(false);
    }
  }, [questId]);

  useEffect(() => {
    if (!questId) {
      setStatus(null);
      setDiscoveries([]);
      setThoughts([]);
      setMapNodes(MAP_NODES_TEMPLATE.map(n => ({ id: n.id, emoji: n.emoji, label: n.label, status: 'queued' as const })));
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    pollStatus();
    intervalRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [questId, pollStatus]);

  const redirect = useCallback(async (message: string) => {
    if (!questId) return;
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/redirect-quest`;
      await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questId, message }),
      });
      setThoughts(prev => [...prev, `> Redirecting: ${message}...`]);
    } catch (e) {
      console.error('Redirect error:', e);
    }
  }, [questId]);

  return { status, discoveries, mapNodes, thoughts, loading, error, redirect };
}
