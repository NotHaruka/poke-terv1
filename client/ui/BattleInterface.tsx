import { MOVES_BY_ID } from '../../shared/pokemonData.js';
import type { MonsterInstance } from '../../shared/types.js';

/**
 * client/ui/BattleInterface.tsx
 *
 * Deliberately state-less/controlled: it takes the current battle's player/opponent Pokémon and
 * an onSelectMove/onSelectSwitch/onRun callback, and renders. It doesn't own a WebSocket
 * connection or call into server/battleResolution.ts directly — that wiring (client socket ->
 * server BattleManager -> events back to client) isn't built yet. This component is the piece
 * that's ready for it: whatever hook manages that connection just needs to feed it props.
 */
export interface BattleInterfaceProps {
  playerMon: MonsterInstance;
  opponentMon: MonsterInstance;
  playerName?: string;
  opponentName?: string;
  message?: string;
  onSelectMove: (moveId: number) => void;
  onSwitch: () => void;
  onRun: () => void;
  disabled?: boolean;
}

function HpBar({ mon }: { mon: MonsterInstance }) {
  const pct = Math.max(0, Math.min(100, (mon.currentHp / mon.maxHp) * 100));
  const color = pct > 50 ? 'bg-emerald-500' : pct > 20 ? 'bg-amber-500' : 'bg-red-500';
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-800">
      <div className={`h-full ${color} transition-all duration-300`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function MonPanel({ mon, name, align }: { mon: MonsterInstance; name: string; align: 'left' | 'right' }) {
  return (
    <div className={`w-56 rounded-lg border border-neutral-800 bg-neutral-950/90 p-3 ${align === 'right' ? 'ml-auto text-right' : ''}`}>
      <div className="flex items-center justify-between text-sm font-semibold text-neutral-100">
        <span>{mon.nickname || name}</span>
        <span className="text-neutral-400">Lv.{mon.level}</span>
      </div>
      <div className="mt-1"><HpBar mon={mon} /></div>
      <div className="mt-1 text-xs text-neutral-500">{mon.currentHp} / {mon.maxHp} HP</div>
    </div>
  );
}

export function BattleInterface({
  playerMon, opponentMon, playerName = 'You', opponentName = 'Wild Pokémon',
  message, onSelectMove, onSwitch, onRun, disabled = false,
}: BattleInterfaceProps) {
  return (
    <div className="w-[640px] rounded-xl border border-neutral-800 bg-gradient-to-b from-neutral-900 to-neutral-950 p-4">
      <div className="flex items-start justify-between">
        <MonPanel mon={opponentMon} name={opponentName} align="left" />
      </div>
      <div className="mt-6 flex items-end justify-between">
        <MonPanel mon={playerMon} name={playerName} align="right" />
      </div>

      <div className="mt-4 rounded-lg border border-neutral-800 bg-black/40 p-3">
        <div className="mb-2 min-h-[1.5rem] text-sm text-neutral-200">
          {message ?? `What will ${playerMon.nickname || playerName} do?`}
        </div>

        <div className="grid grid-cols-2 gap-2">
          {playerMon.moves.map(moveId => {
            const move = MOVES_BY_ID[moveId];
            return (
              <button
                key={moveId}
                disabled={disabled || !move}
                onClick={() => onSelectMove(moveId)}
                className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-left text-sm text-neutral-200 hover:bg-neutral-800 disabled:opacity-40"
              >
                <div className="font-medium">{move?.name ?? `Move #${moveId}`}</div>
                {move && <div className="text-[11px] text-neutral-500">{move.type} · {move.category}</div>}
              </button>
            );
          })}
        </div>

        <div className="mt-2 flex gap-2">
          <button
            disabled={disabled}
            onClick={onSwitch}
            className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
          >
            Switch
          </button>
          <button
            disabled={disabled}
            onClick={onRun}
            className="flex-1 rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-neutral-300 hover:bg-neutral-800 disabled:opacity-40"
          >
            Run
          </button>
        </div>
      </div>
    </div>
  );
}
