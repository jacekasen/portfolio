'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';

type Cs2PlayerAutocompleteProps = {
  defaultValue: string;
  inputId: string;
};

export function Cs2PlayerAutocomplete({ defaultValue, inputId }: Cs2PlayerAutocompleteProps) {
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
        const response = await fetch(`/api/cs2/players?q=${encodeURIComponent(trimmedQuery)}`, {
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
        autoComplete="off"
        placeholder="Search player (e.g. donk, ZywOo, m0NESY)..."
        onChange={(event) => {
          setQuery(event.target.value);
          setSuggestions([]);
          setActiveIndex(-1);
          setIsOpen(false);
        }}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
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
          }
        }}
        role="combobox"
        aria-autocomplete="both"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={
          activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
        }
        className="border-border bg-background focus:border-accent text-foreground h-11 w-full rounded border px-3 text-sm focus:outline-none"
      />

      {isOpen && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          className="border-border bg-surface text-foreground absolute top-full z-20 mt-1 max-h-56 w-full overflow-y-auto rounded-md border shadow-lg"
        >
          {suggestions.map((player, index) => {
            const isSelected = index === activeIndex;

            return (
              <li
                key={player}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choosePlayer(player);
                  const form = event.currentTarget.closest('form');
                  window.requestAnimationFrame(() => form?.requestSubmit());
                }}
                className={`flex cursor-pointer items-center justify-between px-3 py-2 text-sm transition-colors ${
                  isSelected ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-muted/10'
                }`}
              >
                <span>{player}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function startsWithQuery(candidate: string, query: string): boolean {
  return candidate.toLocaleLowerCase().startsWith(query.trim().toLocaleLowerCase());
}
