import { useState, useEffect, useCallback, useRef } from 'react';
import { QuestStatusResponse, Discovery, MapNode } from '@/types';

const MAP_NODES_TEMPLATE: { id: string; emoji: string; label: string; key: string }[] = [
  { id: '1', emoji: '🏰', label: 'Base Camp', key: 'base' },
  { id: '2', emoji: '🌿', label: 'Etsy Forest', key: 'etsy' },
  { id: '3', emoji: '📦', label: 'Amazon Bazaar', key: 'amazon' },
  { id: '4', emoji: '☕', label: 'Specialty Shops', key: 'specialty' },
  { id: '5', emoji: '🎙️', label: 'Niche Stores', key: 'niche' },
  { id: '6', emoji: '⚗️', label: 'Alchemy Score', key: 'alchemy' },
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
  const prevDiscCountRef = useRef(0);

  const pollStatus = useCallback(async () => {
    if (!questId) return;

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quest-status?questId=${questId}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });

      if (!response.ok) throw new Error('Failed to fetch quest status');
      const statusData: QuestStatusResponse = await response.json();

      setStatus(statusData);
      setError(null);

      if (statusData.messages) {
        setThoughts(statusData.messages.map(m => m.summary));
      }

      const visited = new Set(statusData.visitedNodes || []);
      const current = statusData.currentNode;

      setMapNodes(MAP_NODES_TEMPLATE.map(n => ({
        id: n.id, emoji: n.emoji, label: n.label,
        status: visited.has(n.key) && n.key !== current ? 'visited' as const
          : n.key === current ? 'active' as const : 'queued' as const,
      })));

      // Fetch discoveries
      const discUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-discoveries?questId=${questId}`;
      const discResp = await fetch(discUrl, {
        headers: { Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
      });

      if (discResp.ok) {
        const discData = await discResp.json();
        const newDisc = discData.discoveries || [];
        setDiscoveries(newDisc);
      }

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
    if (!questId) return;

    pollStatus();
    intervalRef.current = setInterval(pollStatus, 3000);

    // Client-side safety timeout: stop polling after 12 minutes
    const safetyTimeout = setTimeout(() => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      setStatus(prev => prev ? { ...prev, status: 'complete' } : prev);
    }, 12 * 60 * 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(safetyTimeout);
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
