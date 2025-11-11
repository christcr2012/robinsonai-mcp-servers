/**
 * Episodic Memory
 *
 * Stores conversation and session history for recall.
 * Maintains a rolling window of recent interactions.
 */

const MAX_EPISODES = 25;

export type Episode = {
  role: "user" | "agent";
  text: string;
  at: number;
};

let episodes: Episode[] = [];

/**
 * Add an episode to memory
 *
 * @param e - Episode with role and text
 *
 * @example
 * ```typescript
 * pushEpisode({
 *   role: "user",
 *   text: "Add user authentication to the API"
 * });
 * ```
 */
export function pushEpisode(e: Omit<Episode, "at">): void {
  episodes.push({ ...e, at: Date.now() });
  if (episodes.length > MAX_EPISODES) {
    episodes.shift();
  }
}

/**
 * Get all episodes in memory
 *
 * @returns Array of episodes (up to MAX_EPISODES)
 */
export function getEpisodes(): Episode[] {
  return episodes.slice(-MAX_EPISODES);
}

/**
 * Get episodes by role
 *
 * @param role - Filter by role ("user" or "agent")
 * @returns Filtered episodes
 */
export function getEpisodesByRole(role: "user" | "agent"): Episode[] {
  return episodes.filter(e => e.role === role);
}

/**
 * Get recent episodes
 *
 * @param count - Number of recent episodes to return
 * @returns Recent episodes
 */
export function getRecentEpisodes(count: number = 5): Episode[] {
  return episodes.slice(-count);
}

/**
 * Search episodes by text
 *
 * @param query - Search query
 * @returns Matching episodes
 */
export function searchEpisodes(query: string): Episode[] {
  const lowerQuery = query.toLowerCase();
  return episodes.filter(e => e.text.toLowerCase().includes(lowerQuery));
}

/**
 * Clear all episodes
 */
export function clearEpisodes(): void {
  episodes = [];
}

/**
 * Get episode count
 *
 * @returns Number of episodes in memory
 */
export function getEpisodeCount(): number {
  return episodes.length;
}

/**
 * Get memory usage
 *
 * @returns Object with count and size info
 */
export function getEpisodeMemoryInfo(): {
  count: number;
  maxCapacity: number;
  percentFull: number;
  oldestAt: number | null;
  newestAt: number | null;
} {
  return {
    count: episodes.length,
    maxCapacity: MAX_EPISODES,
    percentFull: (episodes.length / MAX_EPISODES) * 100,
    oldestAt: episodes.length > 0 ? episodes[0].at : null,
    newestAt: episodes.length > 0 ? episodes[episodes.length - 1].at : null
  };
}

/**
 * Export episodes as JSON
 *
 * @returns JSON string of episodes
 */
export function exportEpisodes(): string {
  return JSON.stringify(episodes, null, 2);
}

/**
 * Import episodes from JSON
 *
 * @param json - JSON string of episodes
 */
export function importEpisodes(json: string): void {
  try {
    const imported = JSON.parse(json) as Episode[];
    if (Array.isArray(imported)) {
      episodes = imported.slice(-MAX_EPISODES);
    }
  } catch (err) {
    console.error("[Episodic] Failed to import episodes:", err);
  }
}

/**
 * Get conversation summary
 *
 * @returns Summary of recent conversation
 */
export function getConversationSummary(): {
  totalExchanges: number;
  userMessages: number;
  agentMessages: number;
  timeSpan: number;
  lastInteraction: number | null;
} {
  const userCount = episodes.filter(e => e.role === "user").length;
  const agentCount = episodes.filter(e => e.role === "agent").length;
  const timeSpan = episodes.length > 0 ? episodes[episodes.length - 1].at - episodes[0].at : 0;

  return {
    totalExchanges: episodes.length,
    userMessages: userCount,
    agentMessages: agentCount,
    timeSpan,
    lastInteraction: episodes.length > 0 ? episodes[episodes.length - 1].at : null
  };
}

