'use client';

import { useEffect, useId, useRef, useState } from 'react';

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

  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length < 2 || trimmedQuery === committedQuery) {
      setSuggestions([]);
      setIsOpen(false);
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

  return (
    <div className="relative">
      <input
        id={inputId}
        name="player"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(suggestions.length > 0)}
        onBlur={() => window.setTimeout(() => setIsOpen(false), 100)}
        onKeyDown={(event) => {
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
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        className="border-border bg-background h-11 w-full min-w-0 rounded border px-3"
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
                {player}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
