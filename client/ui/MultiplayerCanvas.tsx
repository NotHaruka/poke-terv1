import { useEffect, useRef, useState } from 'react';
import { WorldCanvas, preloadAtlases } from '../rendering/worldCanvas.js';

/**
 * client/ui/MultiplayerCanvas.tsx
 *
 * Renders the procedurally generated world and moves the camera with arrow keys/WASD.
 * This is intentionally just a camera + renderer wrapper — actual multiplayer state sync
 * (other players' positions, WebSocket connection) isn't wired in yet. server/multiplayer.ts's
 * handlers.ts + game.ts already have the server-side plumbing for that; the missing piece is a
 * client-side WebSocket hook that feeds remote player positions into this component.
 */
export interface MultiplayerCanvasProps {
  seed?: number;
  mapId?: string;
  width?: number;
  height?: number;
}

export function MultiplayerCanvas({ seed = 1, mapId = 'city', width = 800, height = 600 }: MultiplayerCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<WorldCanvas | null>(null);
  const cameraRef = useRef({ x: 0, y: 0 });
  const [ready, setReady] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!canvasRef.current) return;
    const world = new WorldCanvas({ canvas: canvasRef.current, seed, mapId });
    worldRef.current = world;

    let cancelled = false;
    preloadAtlases().then(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, [seed, mapId]);

  useEffect(() => {
    const SPEED = 4;
    const keys = new Set<string>();
    const onKeyDown = (e: KeyboardEvent) => keys.add(e.key.toLowerCase());
    const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    let frame: number;
    const loop = () => {
      const cam = cameraRef.current;
      if (keys.has('arrowup') || keys.has('w')) cam.y -= SPEED;
      if (keys.has('arrowdown') || keys.has('s')) cam.y += SPEED;
      if (keys.has('arrowleft') || keys.has('a')) cam.x -= SPEED;
      if (keys.has('arrowright') || keys.has('d')) cam.x += SPEED;

      worldRef.current?.render(cam.x, cam.y);
      setCoords({ x: Math.round(cam.x), y: Math.round(cam.y) });
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="inline-block rounded-lg border border-neutral-800 bg-neutral-950 p-3">
      <div className="mb-2 flex items-center justify-between text-xs text-neutral-400">
        <span>seed {seed} · map {mapId}</span>
        <span>{ready ? `x ${coords.x}, y ${coords.y}` : 'loading atlases…'}</span>
      </div>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="rounded border border-neutral-800 bg-black"
      />
      <p className="mt-2 text-xs text-neutral-500">WASD / arrow keys to move the camera.</p>
    </div>
  );
}
