export interface FrameRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimationDefinition {
  name: string;
  frames: FrameRect[];
  frameDuration: number; // in seconds
  loop?: boolean;
}

export class Sprite {
  public image: HTMLImageElement | null = null;
  public atlasPath: string;
  public frame: FrameRect;
  public loaded: boolean = false;

  private animations: Map<string, AnimationDefinition> = new Map();
  private currentAnimation: AnimationDefinition | null = null;
  private currentFrameIndex: number = 0;
  private animationTimer: number = 0;

  constructor(atlasPath: string, frame: FrameRect) {
    this.atlasPath = atlasPath;
    this.frame = frame;
  }

  public addAnimation(anim: AnimationDefinition): void {
    this.animations.set(anim.name, anim);
  }

  public playAnimation(name: string): void {
    if (this.currentAnimation?.name === name) return;

    const anim = this.animations.get(name);
    if (anim) {
      this.currentAnimation = anim;
      this.currentFrameIndex = 0;
      this.animationTimer = 0;
      if (anim.frames.length > 0) {
        this.frame = anim.frames[0];
      }
    }
  }

  public update(dt: number): void {
    if (!this.currentAnimation || this.currentAnimation.frames.length <= 1) return;

    this.animationTimer += dt;
    if (this.animationTimer >= this.currentAnimation.frameDuration) {
      this.animationTimer -= this.currentAnimation.frameDuration;
      this.currentFrameIndex++;

      if (this.currentFrameIndex >= this.currentAnimation.frames.length) {
        if (this.currentAnimation.loop !== false) {
          this.currentFrameIndex = 0;
        } else {
          this.currentFrameIndex = this.currentAnimation.frames.length - 1;
        }
      }

      this.frame = this.currentAnimation.frames[this.currentFrameIndex];
    }
  }
}
