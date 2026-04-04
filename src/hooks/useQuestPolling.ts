import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { QuestStatusResponse, Discovery, MapNode } from '@/types';

// Map node definitions
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

  const pollStatus = useCallback(async () => {
    if (!questId) return;

    try {
      const { data, error: fetchErr } = await supabase.functions.invoke('quest-status', {
        body: null,
        method: 'GET',
      });

      // Use query params approach - invoke with GET doesn't support query params well
      // So we'll use fetch directly
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/quest-status?questId=${questId}`;
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (!response.ok) throw new Error('Failed to fetch quest status');
      const statusData: QuestStatusResponse = await response.json();

      setStatus(statusData);
      setError(null);

      // Update thoughts from messages
      if (statusData.messages) {
        setThoughts(statusData.messages.map(m => m.summary));
      }

      // Update map nodes based on visited/current
      const visited = new Set(statusData.visitedNodes || []);
      const current = statusData.currentNode;

      setMapNodes(MAP_NODES_TEMPLATE.map(n => ({
        id: n.id,
        emoji: n.emoji,
        label: n.label,
        status: visited.has(n.key) && n.key !== current
          ? 'visited' as const
          : n.key === current
            ? 'active' as const
            : 'queued' as const,
      })));

      // Fetch discoveries
      const discUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-discoveries?questId=${questId}`;
      const discResp = await fetch(discUrl, {
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
      });

      if (discResp.ok) {
        const discData = await discResp.json();
        setDiscoveries(discData.discoveries || []);
      }

      setLoading(false);

      // Stop polling when complete or error
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

    // Initial fetch
    pollStatus();

    // Poll every 3 seconds
    intervalRef.current = setInterval(pollStatus, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [questId, pollStatus]);

  const redirect = useCallback(async (message: string) => {
    if (!questId) return;

    try {
      const { data, error } = await supabase.functions.invoke('redirect-quest', {
        body: { questId, message },
      });

      if (error) throw error;
      // Add redirect message locally immediately
      setThoughts(prev => [...prev, `> Redirecting: ${message}...`]);
    } catch (e) {
      console.error('Redirect error:', e);
    }
  }, [questId]);

  return { status, discoveries, mapNodes, thoughts, loading, error, redirect };
}
