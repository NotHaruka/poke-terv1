import { Vector2 } from './Entity.js';

export type KeyCode = string;

export interface ActionBinding {
  action: string;
  keys: KeyCode[];
}

export class InputController {
  private keysDown: Set<KeyCode> = new Set();
  private keysPressed: Set<KeyCode> = new Set();
  private keysReleased: Set<KeyCode> = new Set();

  private bindings: Map<string, KeyCode[]> = new Map();
  private mousePosition: Vector2 = { x: 0, y: 0 };
  private mouseButtonsDown: Set<number> = new Set();

  private attachedElement: HTMLElement | Window | null = null;

  constructor() {
    this.setupDefaultBindings();
  }

  public attach(element: HTMLElement | Window = window): void {
    if (this.attachedElement) {
      this.detach();
    }
    this.attachedElement = element;

    element.addEventListener('keydown', this.handleKeyDown as EventListener);
    element.addEventListener('keyup', this.handleKeyUp as EventListener);
    element.addEventListener('mousemove', this.handleMouseMove as EventListener);
    element.addEventListener('mousedown', this.handleMouseDown as EventListener);
    element.addEventListener('mouseup', this.handleMouseUp as EventListener);
  }

  public detach(): void {
    if (!this.attachedElement) return;

    this.attachedElement.removeEventListener('keydown', this.handleKeyDown as EventListener);
    this.attachedElement.removeEventListener('keyup', this.handleKeyUp as EventListener);
    this.attachedElement.removeEventListener('mousemove', this.handleMouseMove as EventListener);
    this.attachedElement.removeEventListener('mousedown', this.handleMouseDown as EventListener);
    this.attachedElement.removeEventListener('mouseup', this.handleMouseUp as EventListener);

    this.attachedElement = null;
    this.reset();
  }

  private handleKeyDown = (e: KeyboardEvent): void => {
    if (!this.keysDown.has(e.code)) {
      this.keysPressed.add(e.code);
    }
    this.keysDown.add(e.code);
  };

  private handleKeyUp = (e: KeyboardEvent): void => {
    this.keysDown.delete(e.code);
    this.keysReleased.add(e.code);
  };

  private handleMouseMove = (e: MouseEvent): void => {
    this.mousePosition = { x: e.clientX, y: e.clientY };
  };

  private handleMouseDown = (e: MouseEvent): void => {
    this.mouseButtonsDown.add(e.button);
  };

  private handleMouseUp = (e: MouseEvent): void => {
    this.mouseButtonsDown.delete(e.button);
  };

  public bindAction(action: string, keys: KeyCode[]): void {
    this.bindings.set(action, keys);
  }

  public isKeyDown(key: KeyCode): boolean {
    return this.keysDown.has(key);
  }

  public isKeyPressed(key: KeyCode): boolean {
    return this.keysPressed.has(key);
  }

  public isKeyReleased(key: KeyCode): boolean {
    return this.keysReleased.has(key);
  }

  public isActionActive(action: string): boolean {
    const keys = this.bindings.get(action);
    if (!keys) return false;
    return keys.some(key => this.isKeyDown(key));
  }

  public isActionPressed(action: string): boolean {
    const keys = this.bindings.get(action);
    if (!keys) return false;
    return keys.some(key => this.isKeyPressed(key));
  }

  public getMovementVector(): Vector2 {
    let x = 0;
    let y = 0;

    if (this.isActionActive('move_up') || this.isKeyDown('KeyW') || this.isKeyDown('ArrowUp')) y -= 1;
    if (this.isActionActive('move_down') || this.isKeyDown('KeyS') || this.isKeyDown('ArrowDown')) y += 1;
    if (this.isActionActive('move_left') || this.isKeyDown('KeyA') || this.isKeyDown('ArrowLeft')) x -= 1;
    if (this.isActionActive('move_right') || this.isKeyDown('KeyD') || this.isKeyDown('ArrowRight')) x += 1;

    // Normalize diagonal movement
    if (x !== 0 && y !== 0) {
      const len = Math.hypot(x, y);
      x /= len;
      y /= len;
    }

    return { x, y };
  }

  public getMousePosition(): Vector2 {
    return { ...this.mousePosition };
  }

  public isMouseDown(button: number = 0): boolean {
    return this.mouseButtonsDown.has(button);
  }

  /**
   * Must be called at the end of each frame update loop to clear single-frame press/release states.
   */
  public update(): void {
    this.keysPressed.clear();
    this.keysReleased.clear();
  }

  public reset(): void {
    this.keysDown.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.mouseButtonsDown.clear();
  }

  private setupDefaultBindings(): void {
    this.bindAction('move_up', ['KeyW', 'ArrowUp']);
    this.bindAction('move_down', ['KeyS', 'ArrowDown']);
    this.bindAction('move_left', ['KeyA', 'ArrowLeft']);
    this.bindAction('move_right', ['KeyD', 'ArrowRight']);
    this.bindAction('action', ['Space', 'KeyE', 'Enter']);
    this.bindAction('cancel', ['Escape', 'KeyX']);
    this.bindAction('run', ['ShiftLeft', 'ShiftRight']);
  }
}
