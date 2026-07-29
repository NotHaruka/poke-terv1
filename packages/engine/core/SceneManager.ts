export interface Scene {
  id: string;
  init?(): void | Promise<void>;
  onEnter?(): void;
  onExit?(): void;
  update?(dt: number): void;
  render?(ctx: CanvasRenderingContext2D): void;
  destroy?(): void;
}

export type SceneTransitionType = 'none' | 'fade';

export interface TransitionOptions {
  duration?: number; // duration in seconds
  type?: SceneTransitionType;
}

export class SceneManager {
  private scenes: Map<string, Scene> = new Map();
  private currentScene: Scene | null = null;
  private pendingScene: Scene | null = null;

  private isTransitioning: boolean = false;
  private transitionProgress: number = 0;
  private transitionDuration: number = 0.3;
  private transitionType: SceneTransitionType = 'none';
  private transitionState: 'none' | 'fadeOut' | 'fadeIn' = 'none';

  public registerScene(scene: Scene): void {
    this.scenes.set(scene.id, scene);
  }

  public unregisterScene(id: string): void {
    const scene = this.scenes.get(id);
    if (scene) {
      if (this.currentScene?.id === id) {
        this.currentScene.onExit?.();
        this.currentScene = null;
      }
      scene.destroy?.();
      this.scenes.delete(id);
    }
  }

  public async switchScene(id: string, options: TransitionOptions = {}): Promise<void> {
    const nextScene = this.scenes.get(id);
    if (!nextScene) {
      throw new Error(`SceneManager: Scene "${id}" not found.`);
    }

    if (this.currentScene?.id === id) return;

    const transitionType = options.type ?? 'none';
    const duration = options.duration ?? 0.3;

    if (transitionType === 'none') {
      if (this.currentScene) {
        this.currentScene.onExit?.();
      }
      this.currentScene = nextScene;
      await this.currentScene.init?.();
      this.currentScene.onEnter?.();
    } else {
      this.pendingScene = nextScene;
      this.isTransitioning = true;
      this.transitionType = transitionType;
      this.transitionDuration = duration;
      this.transitionProgress = 0;
      this.transitionState = 'fadeOut';
    }
  }

  public getCurrentScene(): Scene | null {
    return this.currentScene;
  }

  public update(dt: number): void {
    if (this.isTransitioning) {
      this.transitionProgress += dt / (this.transitionDuration / 2);

      if (this.transitionState === 'fadeOut' && this.transitionProgress >= 1) {
        // Swap scene at dark peak
        if (this.currentScene) {
          this.currentScene.onExit?.();
        }
        this.currentScene = this.pendingScene;
        this.pendingScene = null;

        if (this.currentScene) {
          this.currentScene.init?.();
          this.currentScene.onEnter?.();
        }

        this.transitionProgress = 0;
        this.transitionState = 'fadeIn';
      } else if (this.transitionState === 'fadeIn' && this.transitionProgress >= 1) {
        this.isTransitioning = false;
        this.transitionState = 'none';
        this.transitionProgress = 0;
      }
    }

    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(dt);
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(ctx);
    }

    // Render transition overlay if active
    if (this.isTransitioning && this.transitionType === 'fade') {
      ctx.save();
      const alpha = this.transitionState === 'fadeOut' ? this.transitionProgress : 1 - this.transitionProgress;
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.max(0, Math.min(1, alpha))})`;
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();
    }
  }
}
