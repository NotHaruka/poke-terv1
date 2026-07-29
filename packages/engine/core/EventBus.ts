export type EventListener<T = any> = (data: T) => void;

/**
 * Generic EventBus for publish-subscribe event messaging in the engine.
 */
export class EventBus<Events extends Record<string, any> = Record<string, any>> {
  private listeners: Map<keyof Events, Set<EventListener>> = new Map();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  public on<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);

    return () => this.off(event, listener);
  }

  /**
   * Subscribe to an event once. Automatically unsubscribes after trigger.
   */
  public once<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): () => void {
    const wrapper: EventListener<Events[K]> = (data) => {
      this.off(event, wrapper);
      listener(data);
    };
    return this.on(event, wrapper);
  }

  /**
   * Unsubscribe from an event.
   */
  public off<K extends keyof Events>(event: K, listener: EventListener<Events[K]>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event with data to all subscribers.
   */
  public emit<K extends keyof Events>(event: K, data?: Events[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      // Copy listeners array to handle unsubscribes during emit
      Array.from(set).forEach(listener => {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in EventBus listener for event "${String(event)}":`, err);
        }
      });
    }
  }

  /**
   * Remove all listeners for a specific event or all events.
   */
  public clear<K extends keyof Events>(event?: K): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }
}
