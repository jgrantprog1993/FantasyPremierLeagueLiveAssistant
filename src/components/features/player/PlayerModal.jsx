'use client';

import Image from 'next/image';
import { getShirtUrl } from '@/lib/fpl/endpoints';
import { useEffect, useCallback } from 'react';

const POSITION_NAMES = {
  1: 'Goalkeeper',
  2: 'Defender',
  3: 'Midfielder',
  4: 'Forward',
};

const STAT_LABELS = {
  minutes: 'Minutes',
  goals_scored: 'Goals',
  assists: 'Assists',
  clean_sheets: 'Clean Sheet',
  goals_conceded: 'Goals Conceded',
  own_goals: 'Own Goals',
  penalties_saved: 'Pen Saved',
  penalties_missed: 'Pen Missed',
  yellow_cards: 'Yellow Card',
  red_cards: 'Red Card',
  saves: 'Saves',
  bonus: 'Bonus',
};

/**
 * Player Modal component - Clean White Style
 */
export function PlayerModal({ player, team, isOpen, onClose, livePoints = 0, liveStats = null }) {
  const handleEscape = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleEscape]);

  if (!isOpen || !player) return null;

  const isGoalkeeper = player.element_type === 1;
  const shirtUrl = team?.code ? getShirtUrl(team.code, isGoalkeeper) : null;
  const position = POSITION_NAMES[player.element_type] || 'Unknown';

  // Flatten explain array to get all point sources
  const pointsBreakdown = liveStats?.explain?.flatMap(fixture =>
    fixture.stats.filter(s => s.points !== 0).map(s => ({
      ...s,
      label: STAT_LABELS[s.identifier] || s.identifier,
    }))
  ) || [];

  // Get GW stats
  const gwStats = liveStats?.stats || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-sm bg-white rounded-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white font-bold z-10"
        >
          ✕
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-[#37003c] to-[#5a0050] p-5">
          <div className="flex items-center gap-4">
            {shirtUrl && (
              <div className="w-16 h-20 relative flex-shrink-0">
                <Image src={shirtUrl} alt="shirt" width={64} height={80} className="object-contain" unoptimized />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">{player.web_name}</h2>
              <p className="text-white/60 text-sm">{player.first_name} {player.second_name}</p>
              <div className="flex gap-2 mt-2">
                <span className="px-2 py-0.5 bg-[#00ff87] rounded text-xs text-[#37003c] font-bold">{position}</span>
                <span className="px-2 py-0.5 bg-white/20 rounded text-xs text-white">{team?.short_name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="p-5 space-y-4">
          {/* Key stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-100 p-3 rounded-xl text-center">
              <p className="text-gray-500 text-xs">Price</p>
              <p className="text-gray-900 font-bold">£{(player.now_cost / 10).toFixed(1)}m</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-xl text-center">
              <p className="text-gray-500 text-xs">Selected</p>
              <p className="text-gray-900 font-bold">{player.selected_by_percent}%</p>
            </div>
            <div className="bg-gray-100 p-3 rounded-xl text-center">
              <p className="text-gray-500 text-xs">Form</p>
              <p className="text-[#37003c] font-bold">{player.form}</p>
            </div>
          </div>

          {/* GW Points with breakdown */}
          <div className="bg-[#00ff87] p-4 rounded-xl">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[#37003c]/70 text-sm font-medium">Gameweek Points</p>
              <p className="text-[#37003c] text-2xl font-bold">{livePoints}</p>
            </div>
            {pointsBreakdown.length > 0 && (
              <div className="border-t border-[#37003c]/20 pt-2 mt-2 space-y-1">
                {pointsBreakdown.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-[#37003c]/70">
                      {item.label} {item.value > 1 && `(${item.value})`}
                    </span>
                    <span className={`font-semibold ${item.points > 0 ? 'text-[#37003c]' : 'text-red-600'}`}>
                      {item.points > 0 ? '+' : ''}{item.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Season Stats */}
          <div>
            <p className="text-gray-500 text-xs font-medium mb-2">SEASON STATS</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Goals</p>
                <p className="text-gray-800 font-semibold">{player.goals_scored}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Assists</p>
                <p className="text-gray-800 font-semibold">{player.assists}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">CS</p>
                <p className="text-gray-800 font-semibold">{player.clean_sheets}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Bonus</p>
                <p className="text-gray-800 font-semibold">{player.bonus}</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center mt-2">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Points</p>
                <p className="text-[#37003c] font-semibold">{player.total_points}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Pts/Game</p>
                <p className="text-gray-800 font-semibold">{player.points_per_game}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">xG</p>
                <p className="text-gray-800 font-semibold">{parseFloat(player.expected_goals || 0).toFixed(1)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">xA</p>
                <p className="text-gray-800 font-semibold">{parseFloat(player.expected_assists || 0).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* ICT Index */}
          <div>
            <p className="text-gray-500 text-xs font-medium mb-2">ICT INDEX</p>
            <div className="grid grid-cols-4 gap-2 text-center">
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Influence</p>
                <p className="text-gray-800 font-semibold">{parseFloat(player.influence || 0).toFixed(0)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Creativity</p>
                <p className="text-gray-800 font-semibold">{parseFloat(player.creativity || 0).toFixed(0)}</p>
              </div>
              <div className="bg-gray-50 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">Threat</p>
                <p className="text-gray-800 font-semibold">{parseFloat(player.threat || 0).toFixed(0)}</p>
              </div>
              <div className="bg-[#37003c]/10 p-2 rounded-lg">
                <p className="text-gray-400 text-[10px]">ICT</p>
                <p className="text-[#37003c] font-semibold">{parseFloat(player.ict_index || 0).toFixed(1)}</p>
              </div>
            </div>
          </div>

          {/* Status if not available */}
          {player.status !== 'a' && (
            <div className={`p-3 rounded-xl ${
              player.status === 'd' ? 'bg-yellow-100' : 'bg-red-100'
            }`}>
              <p className={`text-sm font-medium ${
                player.status === 'd' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                {player.status === 'd' ? 'Doubtful' : 'Unavailable'}
                {player.chance_of_playing_next_round != null && (
                  <span className="ml-2">({player.chance_of_playing_next_round}% chance)</span>
                )}
              </p>
              {player.news && (
                <p className={`text-xs mt-1 ${
                  player.status === 'd' ? 'text-yellow-600' : 'text-red-600'
                }`}>{player.news}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayerModal;
