import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  valueKey = 'id',
  labelKey = 'nome',
  placeholder = 'Selecione...',
  searchPlaceholder = 'Buscar...',
  emptyMessage = 'Nenhum resultado encontrado',
  disabled = false,
  required = false,
  renderOption,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const filtered = options.filter((opt) => {
    if (!searchTerm) return true;
    const label = String(opt[labelKey] || '').toLowerCase();
    return label.includes(searchTerm.toLowerCase());
  });

  const selectedOption = options.find((opt) => opt[valueKey] === value);

  const open = useCallback(() => {
    if (disabled) return;
    setIsOpen(true);
    setSearchTerm('');
    setHighlightedIndex(-1);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [disabled]);

  const close = useCallback(() => {
    setIsOpen(false);
    setSearchTerm('');
    setHighlightedIndex(-1);
  }, []);

  const select = useCallback(
    (opt) => {
      onChange(opt[valueKey]);
      close();
    },
    [onChange, valueKey, close],
  );

  const clear = useCallback(
    (e) => {
      e.stopPropagation();
      onChange('');
    },
    [onChange],
  );

  // Click outside
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        close();
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, close]);

  // Scroll highlighted into view
  useEffect(() => {
    if (highlightedIndex < 0 || !listRef.current) return;
    const item = listRef.current.children[highlightedIndex];
    if (item) item.scrollIntoView({ block: 'nearest' });
  }, [highlightedIndex]);

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        open();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filtered.length - 1 ? prev + 1 : 0,
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filtered.length - 1,
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && filtered[highlightedIndex]) {
          select(filtered[highlightedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
    }
  };

  const inputClass =
    'mt-1 block w-full rounded-lg border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]';

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={`${inputClass} flex cursor-pointer items-center justify-between text-left ${
          disabled ? 'cursor-not-allowed bg-slate-50 opacity-60' : ''
        } ${!value ? 'text-slate-400' : 'text-slate-900'}`}
      >
        <span className="truncate">
          {selectedOption ? selectedOption[labelKey] : placeholder}
        </span>
        <span className="ml-2 flex items-center gap-1">
          {value && !disabled && !required && (
            <X
              className="h-4 w-4 text-slate-400 hover:text-slate-600"
              onClick={clear}
            />
          )}
          {isOpen ? (
            <ChevronUp className="h-4 w-4 text-slate-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400" />
          )}
        </span>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-slate-200 bg-white shadow-lg">
          {/* Search input */}
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                className="w-full rounded-md border border-slate-200 py-1.5 pl-8 pr-3 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              />
            </div>
          </div>

          {/* Options list */}
          <ul ref={listRef} className="max-h-60 overflow-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-center text-sm text-slate-400">
                {emptyMessage}
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const isSelected = opt[valueKey] === value;
                const isHighlighted = idx === highlightedIndex;
                return (
                  <li
                    key={opt[valueKey]}
                    onClick={() => select(opt)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`cursor-pointer px-3 py-2 text-sm ${
                      isSelected
                        ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                        : isHighlighted
                          ? 'bg-slate-50'
                          : ''
                    }`}
                  >
                    {renderOption ? renderOption(opt) : opt[labelKey]}
                  </li>
                );
              })
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
