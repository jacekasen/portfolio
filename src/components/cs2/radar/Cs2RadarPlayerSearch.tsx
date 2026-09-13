'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { RadarManifest } from '@/lib/cs2/radar';

export const POPULAR_PLAYERS = [
  'donk',
  'ZywOo',
  'm0NESY',
  'NiKo',
  'ropz',
  'sh1ro',
  'molodoy',
  'frozen',
  'XANTARES',
  'Twistzz',
];

function normalizePlayerKey(name: string): string {
  return name.toLowerCase().replace(/0/g, 'o').replace(/1/g, 'i');
}

type Props = {
  manifest?: RadarManifest | null;
  selectedPlayer: string;
  onSelectPlayer?: (player: string) => void;
  basePath?: string;
};

export function Cs2RadarPlayerSearch({
  manifest: propManifest,
  selectedPlayer,
  onSelectPlayer,
  basePath,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const listboxId = useId();
  const [query, setQuery] = useState(selectedPlayer);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const [fetchedManifest, setFetchedManifest] = useState<RadarManifest | null>(null);

  useEffect(() => {
    if (propManifest) return;

    let isCancelled = false;
    fetch('/data/cs2/radar/manifest.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error(`Failed to load manifest: ${res.status}`);
      })
      .then((data: RadarManifest) => {
        if (!isCancelled) setFetchedManifest(data);
      })
      .catch((err) => console.error('Error fetching radar manifest:', err));

    return () => {
      isCancelled = true;
    };
  }, [propManifest]);

  const manifest = propManifest ?? fetchedManifest;

  const [prevSelectedPlayer, setPrevSelectedPlayer] = useState(selectedPlayer);

  // Synchronize input query when selectedPlayer prop changes externally
  if (prevSelectedPlayer !== selectedPlayer) {
    setPrevSelectedPlayer(selectedPlayer);
    setQuery(selectedPlayer);
    setIsOpen(false);
    setActiveIndex(-1);
  }

  // Candidates filtered from pre-loaded manifest players
  const filteredPlayers = useMemo(() => {
    const players = manifest?.players ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return players;

    const normQ = normalizePlayerKey(q);

    const matches = players.filter((p) => {
      const pLower = p.player.toLowerCase();
      const pNorm = normalizePlayerKey(p.player);
      return (
        pLower.includes(q) ||
        pNorm.includes(normQ) ||
        (p.role && p.role.toLowerCase().includes(q)) ||
        (p.country && p.country.toLowerCase().includes(q))
      );
    });

    // Sort candidates: prefix match on player name first, then substring match, then role/country match
    return matches.sort((a, b) => {
      const aStarts =
        a.player.toLowerCase().startsWith(q) || normalizePlayerKey(a.player).startsWith(normQ);
      const bStarts =
        b.player.toLowerCase().startsWith(q) || normalizePlayerKey(b.player).startsWith(normQ);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;

      const aIncludes =
        a.player.toLowerCase().includes(q) || normalizePlayerKey(a.player).includes(normQ);
      const bIncludes =
        b.player.toLowerCase().includes(q) || normalizePlayerKey(b.player).includes(normQ);
      if (aIncludes && !bIncludes) return -1;
      if (!aIncludes && bIncludes) return 1;

      return a.player.localeCompare(b.player);
    });
  }, [manifest?.players, query]);

  // Inline ghost text suggestion (exact prefix match)
  const inlineSuggestion = useMemo(() => {
    const q = query.trim();
    if (!q || q.length < 1) return null;

    const normQ = normalizePlayerKey(q);

    const activeCandidate = activeIndex >= 0 ? filteredPlayers[activeIndex]?.player : undefined;
    const candidate =
      activeCandidate ??
      filteredPlayers.find((p) => {
        const pLower = p.player.toLowerCase();
        return pLower.startsWith(q.toLowerCase()) || normalizePlayerKey(p.player).startsWith(normQ);
      })?.player;

    if (!candidate) return null;
    if (candidate.toLowerCase() === q.toLowerCase()) return null;
    if (
      !candidate.toLowerCase().startsWith(q.toLowerCase()) &&
      !normalizePlayerKey(candidate).startsWith(normQ)
    )
      return null;

    return candidate;
  }, [activeIndex, filteredPlayers, query]);

  const choosePlayer = (playerName: string) => {
    const norm = normalizePlayerKey(playerName);
    const matched = manifest?.players?.find(
      (p) =>
        p.player.toLowerCase() === playerName.toLowerCase() ||
        normalizePlayerKey(p.player) === norm,
    );
    const resolvedName = matched ? matched.player : playerName;
    setQuery(resolvedName);
    setIsOpen(false);
    setActiveIndex(-1);

    if (onSelectPlayer) {
      onSelectPlayer(resolvedName);
    } else {
      const params = new URLSearchParams(searchParams ? searchParams.toString() : '');
      params.set('player', resolvedName);
      const target = basePath ?? (typeof window !== 'undefined' ? window.location.pathname : '');
      router.push(`${target}?${params.toString()}`);
    }
  };

  const acceptInlineSuggestion = () => {
    if (!inlineSuggestion) return false;
    choosePlayer(inlineSuggestion);
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeIndex >= 0 && filteredPlayers[activeIndex]) {
      choosePlayer(filteredPlayers[activeIndex].player);
      return;
    }
    if (inlineSuggestion) {
      choosePlayer(inlineSuggestion);
      return;
    }
    if (filteredPlayers.length > 0) {
      choosePlayer(filteredPlayers[0].player);
      return;
    }
    if (query.trim()) {
      choosePlayer(query.trim());
    }
  };

  return (
    <section
      aria-label="Search and select CS2 pro players"
      className="border-border bg-surface space-y-3 rounded-lg border p-4"
    >
      <form
        action={basePath}
        method="GET"
        onSubmit={handleSubmit}
        className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end"
      >
        <div className="grid gap-1.5">
          <label
            htmlFor="cs2-radar-player-search"
            className="text-muted font-mono text-xs font-bold tracking-wide uppercase"
          >
            Search Pro Player
          </label>

          <div className="relative">
            {/* Inline Ghost Text Completion */}
            {inlineSuggestion && (
              <div
                aria-hidden="true"
                data-testid="inline-player-suggestion"
                className="pointer-events-none absolute inset-0 z-10 flex h-11 items-center overflow-hidden rounded border border-transparent px-3 font-mono text-sm whitespace-pre"
              >
                <span className="text-transparent">{inlineSuggestion.slice(0, query.length)}</span>
                <span className="text-muted/50">{inlineSuggestion.slice(query.length)}</span>
              </div>
            )}

            <input
              id="cs2-radar-player-search"
              name="player"
              type="text"
              value={query}
              autoComplete="off"
              placeholder="Search pro player (e.g. donk, ZywOo, m0NESY)..."
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
                setActiveIndex(-1);
              }}
              onFocus={() => {
                if (query.trim().length > 0) setIsOpen(true);
              }}
              onBlur={() => window.setTimeout(() => setIsOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && inlineSuggestion) {
                  e.preventDefault();
                  acceptInlineSuggestion();
                  return;
                }

                if (
                  e.key === 'ArrowRight' &&
                  inlineSuggestion &&
                  e.currentTarget.selectionStart === query.length &&
                  e.currentTarget.selectionEnd === query.length
                ) {
                  e.preventDefault();
                  acceptInlineSuggestion();
                  return;
                }

                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (activeIndex >= 0 && filteredPlayers[activeIndex]) {
                    choosePlayer(filteredPlayers[activeIndex].player);
                  } else if (inlineSuggestion) {
                    choosePlayer(inlineSuggestion);
                  } else if (filteredPlayers.length > 0) {
                    choosePlayer(filteredPlayers[0].player);
                  } else if (query.trim()) {
                    choosePlayer(query.trim());
                  }
                  return;
                }

                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  if (!isOpen) {
                    setIsOpen(true);
                    return;
                  }
                  if (filteredPlayers.length > 0) {
                    setActiveIndex((prev) => (prev + 1) % filteredPlayers.length);
                  }
                } else if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  if (!isOpen) {
                    setIsOpen(true);
                    return;
                  }
                  if (filteredPlayers.length > 0) {
                    setActiveIndex((prev) => (prev <= 0 ? filteredPlayers.length - 1 : prev - 1));
                  }
                } else if (e.key === 'Escape') {
                  setIsOpen(false);
                  setActiveIndex(-1);
                }
              }}
              role="combobox"
              aria-autocomplete="both"
              aria-expanded={isOpen}
              aria-controls={listboxId}
              aria-activedescendant={
                activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
              }
              className="border-border bg-background focus:border-accent text-foreground relative h-11 w-full rounded border px-3 font-mono text-sm focus:outline-none"
            />

            {/* Dropdown Suggestions List */}
            {isOpen && filteredPlayers.length > 0 && (
              <ul
                id={listboxId}
                role="listbox"
                className="border-border bg-surface text-foreground absolute top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-md border py-1 shadow-2xl"
              >
                {filteredPlayers.slice(0, 10).map((item, idx) => {
                  const isSelected = idx === activeIndex;
                  return (
                    <li
                      key={item.player}
                      id={`${listboxId}-option-${idx}`}
                      role="option"
                      aria-selected={isSelected}
                    >
                      <button
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => choosePlayer(item.player)}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left font-mono text-xs transition-colors ${
                          isSelected ? 'bg-accent/20 text-accent font-bold' : 'hover:bg-muted/10'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">
                            <HighlightedText text={item.player} query={query} />
                          </span>
                          {item.country && (
                            <span className="text-muted text-[10px]">({item.country})</span>
                          )}
                        </div>
                        <div className="text-muted flex items-center gap-2 text-[11px]">
                          {item.role && <span>{item.role}</span>}
                          <span>·</span>
                          <span>{item.totalKills} kills</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <button
          type="submit"
          className="bg-accent text-background hover:bg-accent/90 h-11 rounded px-5 font-mono text-sm font-bold transition-colors"
        >
          Inspect Player
        </button>
      </form>

      {/* Popular Players Pill Navigation */}
      <nav
        aria-label="Popular players"
        className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-1"
      >
        <span className="text-muted font-mono text-xs tracking-wide uppercase">
          Popular players:
        </span>
        <ul className="flex flex-wrap gap-1.5 font-mono text-xs">
          {POPULAR_PLAYERS.map((name) => {
            const isCurrent =
              name.toLowerCase() === selectedPlayer.toLowerCase() ||
              normalizePlayerKey(name) === normalizePlayerKey(selectedPlayer);

            return (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => choosePlayer(name)}
                  aria-current={isCurrent ? 'page' : undefined}
                  className={`inline-block rounded-full border px-3 py-1 font-mono text-xs transition-colors ${
                    isCurrent
                      ? 'border-accent bg-accent text-background font-bold'
                      : 'border-border bg-background hover:border-accent hover:text-accent'
                  }`}
                >
                  {name}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </section>
  );
}

function HighlightedText({ text, query }: { text: string; query: string }) {
  const cleanQ = query.trim().toLowerCase();
  if (!cleanQ) return <>{text}</>;

  const startIdx = text.toLowerCase().indexOf(cleanQ);
  if (startIdx === -1) return <>{text}</>;

  const endIdx = startIdx + cleanQ.length;

  return (
    <>
      {text.slice(0, startIdx)}
      <mark className="bg-accent-light/25 rounded-xs font-bold text-inherit">
        {text.slice(startIdx, endIdx)}
      </mark>
      {text.slice(endIdx)}
    </>
  );
}
