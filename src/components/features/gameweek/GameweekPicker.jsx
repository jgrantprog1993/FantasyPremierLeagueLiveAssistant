'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils/cn';

/**
 * Chevron Left Icon
 */
function ChevronLeft({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
  );
}

/**
 * Chevron Right Icon
 */
function ChevronRight({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

/**
 * Chevron Down Icon
 */
function ChevronDown({ className }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

/**
 * GameweekPicker component
 * Allows navigation between gameweeks with a dropdown for quick selection
 *
 * @param {Object} props
 * @param {number} props.selectedGw - Currently selected gameweek
 * @param {number} props.currentGw - The actual current gameweek in the season
 * @param {number} props.minGw - Minimum available gameweek (usually 1 or first GW with data)
 * @param {number} props.maxGw - Maximum available gameweek
 * @param {Array} props.gameweekHistory - Array of {event, points, rank} for each played GW
 * @param {Function} props.onSelect - Callback when gameweek is selected
 * @param {string} props.activeChip - Chip used in selected gameweek
 */
export function GameweekPicker({
  selectedGw,
  currentGw,
  minGw = 1,
  maxGw = 38,
  gameweekHistory = [],
  onSelect,
  activeChip,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Get history data for a specific gameweek
  const getGwData = (gw) => {
    return gameweekHistory.find(h => h.event === gw);
  };

  const selectedGwData = getGwData(selectedGw);
  const canGoPrev = selectedGw > minGw;
  const canGoNext = selectedGw < maxGw;
  const isCurrentGw = selectedGw === currentGw;

  return (
    <div className="flex items-center gap-2" ref={dropdownRef}>
      {/* Previous button */}
      <button
        onClick={() => canGoPrev && onSelect(selectedGw - 1)}
        disabled={!canGoPrev}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canGoPrev
            ? 'hover:bg-[var(--fpl-purple)]/10 text-[var(--fpl-purple)]'
            : 'text-gray-300 cursor-not-allowed'
        )}
        aria-label="Previous gameweek"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Gameweek selector */}
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            'bg-[var(--fpl-purple)] text-white hover:bg-[var(--fpl-purple-light)]'
          )}
        >
          <span>GW{selectedGw}</span>
          {isCurrentGw && (
            <span className="px-1.5 py-0.5 bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-xs rounded font-bold">
              LIVE
            </span>
          )}
          <ChevronDown className={cn('w-4 h-4 transition-transform', isOpen && 'rotate-180')} />
        </button>

        {/* Dropdown */}
        {isOpen && (
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 max-h-80 overflow-y-auto bg-white rounded-lg shadow-lg border border-gray-200 z-50">
            <div className="p-2">
              <p className="text-xs text-gray-500 uppercase tracking-wide px-2 py-1">
                Select Gameweek
              </p>
              {Array.from({ length: maxGw - minGw + 1 }, (_, i) => {
                const gw = maxGw - i; // Reverse order (newest first)
                const gwData = getGwData(gw);
                const isCurrent = gw === currentGw;
                const isSelected = gw === selectedGw;
                const hasData = !!gwData;

                return (
                  <button
                    key={gw}
                    onClick={() => {
                      onSelect(gw);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors',
                      isSelected
                        ? 'bg-[var(--fpl-purple)] text-white'
                        : 'hover:bg-gray-100 text-gray-700'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">GW{gw}</span>
                      {isCurrent && (
                        <span className={cn(
                          'px-1.5 py-0.5 text-xs rounded font-bold',
                          isSelected
                            ? 'bg-[var(--fpl-green)] text-[var(--fpl-purple)]'
                            : 'bg-[var(--fpl-green)]/20 text-[var(--fpl-purple)]'
                        )}>
                          LIVE
                        </span>
                      )}
                    </div>
                    {hasData && (
                      <div className="text-right">
                        <span className={cn(
                          'font-bold',
                          isSelected ? 'text-[var(--fpl-green)]' : 'text-[var(--fpl-purple)]'
                        )}>
                          {gwData.points} pts
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Next button */}
      <button
        onClick={() => canGoNext && onSelect(selectedGw + 1)}
        disabled={!canGoNext}
        className={cn(
          'p-2 rounded-lg transition-colors',
          canGoNext
            ? 'hover:bg-[var(--fpl-purple)]/10 text-[var(--fpl-purple)]'
            : 'text-gray-300 cursor-not-allowed'
        )}
        aria-label="Next gameweek"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Points display */}
      {selectedGwData && (
        <div className="ml-2 flex items-center gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--fpl-green)]">
              {selectedGwData.points}
            </p>
            <p className="text-xs text-gray-500">points</p>
          </div>
          {selectedGwData.rank && (
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-700">
                {selectedGwData.rank.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">GW rank</p>
            </div>
          )}
          {activeChip && (
            <span className="px-2 py-1 bg-[var(--fpl-pink)] text-white text-xs rounded font-medium">
              {activeChip.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Compact gameweek picker for mobile
 */
export function GameweekPickerCompact({
  selectedGw,
  currentGw,
  minGw = 1,
  maxGw = 38,
  onSelect,
}) {
  const canGoPrev = selectedGw > minGw;
  const canGoNext = selectedGw < maxGw;
  const isCurrentGw = selectedGw === currentGw;

  return (
    <div className="flex items-center justify-center gap-1">
      <button
        onClick={() => canGoPrev && onSelect(selectedGw - 1)}
        disabled={!canGoPrev}
        className={cn(
          'p-1.5 rounded transition-colors',
          canGoPrev
            ? 'hover:bg-white/20 text-white'
            : 'text-white/30 cursor-not-allowed'
        )}
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-lg">
        <span className="font-semibold text-white">GW{selectedGw}</span>
        {isCurrentGw && (
          <span className="px-1.5 py-0.5 bg-[var(--fpl-green)] text-[var(--fpl-purple)] text-xs rounded font-bold">
            LIVE
          </span>
        )}
      </div>

      <button
        onClick={() => canGoNext && onSelect(selectedGw + 1)}
        disabled={!canGoNext}
        className={cn(
          'p-1.5 rounded transition-colors',
          canGoNext
            ? 'hover:bg-white/20 text-white'
            : 'text-white/30 cursor-not-allowed'
        )}
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}

export default GameweekPicker;
