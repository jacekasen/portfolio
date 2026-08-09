'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

type PlayerAutocompleteProps = {
  defaultValue: string;
  inputId: string;
};

export function PlayerAutocomplete({ defaultValue, inputId }: PlayerAutocompleteProps) {
  const listboxId = useId();
  const requestId = useRef(0);
  const [query, setQuery] = useState(defaultValue);
  const [committedQuery, setCommittedQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);

  const inlineSuggestion = useMemo(() => {
    if (!isOpen || query.length < 2) return null;

    const activeSuggestion = activeIndex >= 0 ? suggestions[activeIndex] : undefined;
    const candidate =
      activeSuggestion ?? suggestions.find((player) => startsWithQuery(player, query));

    return candidate && startsWithQuery(candidate, query) && candidate !== query ? candidate : null;
  }, [activeIndex, isOpen, query, suggestions]);

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2 || trimmedQuery === committedQuery) {
      return;
    }

    const currentRequest = ++requestId.current;
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/nba/players?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const names = (await response.json()) as string[];
        if (requestId.current !== currentRequest) return;
        setSuggestions(names);
        setActiveIndex(-1);
        setIsOpen(names.length > 0);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          setSuggestions([]);
          setIsOpen(false);
        }
      }
    }, 180);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [committedQuery, query]);

  const choosePlayer = (player: string) => {
    setQuery(player);
    setCommittedQuery(player);
    setSuggestions([]);
    setActiveIndex(-1);
    setIsOpen(false);
  };

  const acceptInlineSuggestion = () => {
    if (!inlineSuggestion) return false;
    choosePlayer(inlineSuggestion);
    return true;
  };

  return (
    <div className="relative">
      {inlineSuggestion && (
        <div
          aria-hidden="true"
          data-testid="inline-player-suggestion"
          className="pointer-events-none absolute inset-0 z-10 flex h-11 items-center overflow-hidden rounded border border-transparent px-3 whitespace-pre"
        >
          <span className="text-transparent">{query}</span>
          <span className="text-muted/50">{inlineSuggestion.slice(query.length)}</span>
        </div>
      )}

      <input
        id={inputId}
        name="player"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setSuggestions([]);
          setActiveIndex(-1);
          setIsOpen(false);
        }}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
        onKeyDown={(event) => {
          if (event.key === 'Tab' && inlineSuggestion) {
            event.preventDefault();
            acceptInlineSuggestion();
            return;
          }

          if (
            event.key === 'ArrowRight' &&
            inlineSuggestion &&
            event.currentTarget.selectionStart === query.length &&
            event.currentTarget.selectionEnd === query.length
          ) {
            event.preventDefault();
            acceptInlineSuggestion();
            return;
          }

          if (event.key === 'Enter') {
            if (isOpen && suggestions.length > 0) {
              event.preventDefault();
              const selectedPlayer = activeIndex >= 0 ? suggestions[activeIndex] : suggestions[0];
              const form = event.currentTarget.form;
              choosePlayer(selectedPlayer);
              window.requestAnimationFrame(() => form?.requestSubmit());
            }
            return;
          }

          if (!isOpen || suggestions.length === 0) return;

          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveIndex((index) => (index + 1) % suggestions.length);
          } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
          } else if (event.key === 'Escape') {
            setIsOpen(false);
            setActiveIndex(-1);
          }
        }}
        placeholder="LeBron James"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="both"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        className="border-border bg-background relative h-11 w-full min-w-0 rounded border px-3"
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="border-border bg-background absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded border py-1 shadow-lg"
        >
          {suggestions.map((player, index) => (
            <li
              key={player}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => choosePlayer(player)}
                className={`w-full px-3 py-2 text-left text-sm ${
                  index === activeIndex ? 'bg-accent-light/20 text-accent' : 'hover:bg-surface'
                }`}
              >
                <HighlightedPlayerName player={player} query={query} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function startsWithQuery(player: string, query: string) {
  return player.toLocaleLowerCase().startsWith(query.toLocaleLowerCase());
}

function HighlightedPlayerName({ player, query }: { player: string; query: string }) {
  const matchStart = player.toLocaleLowerCase().indexOf(query.trim().toLocaleLowerCase());

  if (matchStart < 0 || !query.trim()) return player;

  const matchEnd = matchStart + query.trim().length;

  return (
    <>
      {player.slice(0, matchStart)}
      <mark className="bg-accent-light/25 rounded-sm text-inherit">
        {player.slice(matchStart, matchEnd)}
      </mark>
      {player.slice(matchEnd)}
    </>
  );
}
