import { Vector2, BoundingBox } from './Entity.js';

export interface CameraOptions {
  x?: number;
  y?: number;
  viewportWidth: number;
  viewportHeight: number;
  zoom?: number;
  smoothness?: number; // 0 (instant) to 1 (sluggish)
  bounds?: BoundingBox | null;
}

export class Camera {
  public x: number;
  public y: number;
  public viewportWidth: number;
  public viewportHeight: number;
  public zoom: number;
  public smoothness: number;
  public bounds: BoundingBox | null;

  private target: { position: Vector2 } | null = null;

  constructor(opts: CameraOptions) {
    this.x = opts.x ?? 0;
    this.y = opts.y ?? 0;
    this.viewportWidth = opts.viewportWidth;
    this.viewportHeight = opts.viewportHeight;
    this.zoom = opts.zoom ?? 1;
    this.smoothness = opts.smoothness ?? 0.1;
    this.bounds = opts.bounds ?? null;
  }

  public follow(target: { position: Vector2 } | null): void {
    this.target = target;
  }

  public setPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.clampToBounds();
  }

  public update(dt: number): void {
    if (!this.target) return;

    const targetX = this.target.position.x;
    const targetY = this.target.position.y;

    if (this.smoothness <= 0) {
      this.x = targetX;
      this.y = targetY;
    } else {
      // Lerp camera towards target
      const lerpFactor = 1 - Math.pow(this.smoothness, dt * 60);
      this.x += (targetX - this.x) * lerpFactor;
      this.y += (targetY - this.y) * lerpFactor;
    }

    this.clampToBounds();
  }

  public resize(width: number, height: number): void {
    this.viewportWidth = width;
    this.viewportHeight = height;
    this.clampToBounds();
  }

  public worldToScreen(worldPos: Vector2): Vector2 {
    return {
      x: (worldPos.x - this.x) * this.zoom + this.viewportWidth / 2,
      y: (worldPos.y - this.y) * this.zoom + this.viewportHeight / 2,
    };
  }

  public screenToWorld(screenPos: Vector2): Vector2 {
    return {
      x: (screenPos.x - this.viewportWidth / 2) / this.zoom + this.x,
      y: (screenPos.y - this.viewportHeight / 2) / this.zoom + this.y,
    };
  }

  public getViewportBounds(): BoundingBox {
    const halfW = (this.viewportWidth / 2) / this.zoom;
    const halfH = (this.viewportHeight / 2) / this.zoom;
    return {
      x: this.x - halfW,
      y: this.y - halfH,
      width: halfW * 2,
      height: halfH * 2,
    };
  }

  private clampToBounds(): void {
    if (!this.bounds) return;

    const halfW = (this.viewportWidth / 2) / this.zoom;
    const halfH = (this.viewportHeight / 2) / this.zoom;

    const minX = this.bounds.x + halfW;
    const maxX = this.bounds.x + this.bounds.width - halfW;
    const minY = this.bounds.y + halfH;
    const maxY = this.bounds.y + this.bounds.height - halfH;

    if (minX <= maxX) {
      this.x = Math.max(minX, Math.min(maxX, this.x));
    } else {
      this.x = this.bounds.x + this.bounds.width / 2;
    }

    if (minY <= maxY) {
      this.y = Math.max(minY, Math.min(maxY, this.y));
    } else {
      this.y = this.bounds.y + this.bounds.height / 2;
    }
  }
}
