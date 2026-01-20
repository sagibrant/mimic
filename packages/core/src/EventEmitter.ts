/**
 * @copyright 2026 Sagi All Rights Reserved.
 * @author: Sagi <sagibrant@hotmail.com>
 * @license Apache-2.0
 * @file EventEmitter.ts
 * @description 
 * A robust event emitter supporting:
 * - Strongly typed event system
 * - Event name validation
 * - Synchronous/Asynchronous dispatching
 * - One-time listeners
 * - Listener priorities
 * - Event propagation control
 * 
 * 
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * 
 * Example Usage:
 * 
 * // Define event types
 * type MyEvents = {
 *   login: { username: string; timestamp: number };
 *   logout: void;
 *   message: string;
 * };
 * 
 * // Create emitter
 * const emitter = new EventEmitter<MyEvents>();
 * 
 * // Set allowed events (optional)
 * emitter.setAllowedEvents("login", "logout", "message");
 * 
 * // Register listeners
 * emitter.on("login", (data) => {
 *   console.log(`User ${data.username} logged in at ${new Date(data.timestamp)}`);
 * });
 * 
 * emitter.once("message", (msg) => {
 *   console.log("Received message:", msg);
 * });
 * 
 * // Emit events
 * emitter.emit("login", { username: "john", timestamp: Date.now() });
 * 
 * // Async emission
 * emitter.emitAsyncParallel("message", "Hello world!");
 * 
 * // Remove listener
 * emitter.off("login", myLoginListener);
 */
import * as Utils from "./Utils";
import { Logger } from "./Logger";

// EventMap defines the structure of events: event names mapped to their payload types
export type EventMap = Record<string, unknown>;

// Listener function type that can handle both sync and async operations
type Listener<Args> = (args: Args) => void | Promise<void>;

// Wrapper object to store listener metadata
interface ListenerWrapper<Args> {
  listener: Listener<Args>;
  priority: number;  // Higher priority executes first
  once: boolean;     // Flag for one-time execution
}

export class EventEmitter<Events extends EventMap = Record<string, unknown>> {
  // Stores all event listeners in a nested map structure
  private _listeners: Map<keyof Events, ListenerWrapper<Events[keyof Events]>[]> = new Map();

  // Optional set of allowed event names for validation
  private _allowedEvents: Set<keyof Events> | null = null;

  // Logger instance for event tracking and error reporting
  protected readonly logger: Logger;

  constructor() {
    const prefix = Utils.isEmpty(this.constructor?.name) ? "EventEmitter" : this.constructor?.name;
    this.logger = new Logger(prefix);
  }

  /**
   * Restricts valid event names to a predefined set
   * @param events - List of allowed event names
   */
  setAllowedEvents(...events: (keyof Events)[]): void {
    this._allowedEvents = new Set(events);
  }

  /**
   * Registers a listener for a specific event
   * @param event - Event name to listen for
   * @param listener - Callback function to execute
   * @param options - Configuration for listener behavior
   *        priority: Higher values execute first (default: 0)
   *        once: Remove after first execution (default: false)
   * @returns EventEmitter instance for chaining
   */
  on<Event extends keyof Events>(
    event: Event,
    listener: Listener<Events[Event]>,
    options: { priority?: number; once?: boolean } = {}
  ): this {
    this.validateEventName(event);

    // Initialize event bucket if needed
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }

    // Add listener with metadata
    const listeners = this._listeners.get(event) || [];
    listeners.push({
      listener: listener as Listener<Events[keyof Events]>,
      priority: options.priority ?? 0,
      once: options.once ?? false
    });

    // Maintain execution order by priority (highest first)
    listeners.sort((a, b) => b.priority - a.priority);

    return this;
  }

  /**
   * Registers a one-time listener for an event
   * @param event - Event name to listen for
   * @param listener - Callback to execute once
   * @param priority - Execution order priority (default: 0)
   * @returns EventEmitter instance for chaining
   */
  once<Event extends keyof Events>(
    event: Event,
    listener: Listener<Events[Event]>,
    priority = 0
  ): this {
    return this.on(event, listener, { once: true, priority });
  }

  /**
   * Removes a specific listener from an event
   * @param event - Event name to modify
   * @param listener - Callback reference to remove
   * @returns EventEmitter instance for chaining
   */
  off<Event extends keyof Events>(
    event: Event,
    listener: Listener<Events[Event]>
  ): this {
    this.validateEventName(event);

    const listeners = this._listeners.get(event);
    if (!listeners) return this;

    // Filter out exact listener reference
    this._listeners.set(
      event,
      listeners.filter(l => l.listener !== listener)
    );

    return this;
  }

  /**
   * Removes all registered listeners
   * @returns EventEmitter instance for chaining
   */
  clearAllListeners(): this {
    this._listeners.clear();
    return this;
  }

  /**
   * Checks if an event has registered listeners
   * @param event - Event name to check
   * @returns True if listeners exist, false otherwise
   */
  hasListeners<Event extends keyof Events>(event: Event): boolean {
    const listeners = this._listeners.get(event);
    return !!listeners && listeners.length > 0;
  }

  /**
   * Synchronously dispatches an event to all listeners
   * Note: Handles async listeners by catching potential rejections
   * @param event - Event name to emit
   * @param args - Payload data for the event
   */
  emit<Event extends keyof Events>(
    event: Event,
    args: Events[Event]
  ): void {
    this.validateEventName(event);

    const listeners = this._listeners.get(event);
    if (!listeners || listeners.length === 0) {
      this.logger.warn(`No listeners for event "${String(event)}" - ${JSON.stringify(args)}`);
      return;
    }

    // Clone listeners to avoid mutation during iteration
    const listenersCopy = [...listeners];
    const onceListenersToRemove: Listener<Events[Event]>[] = [];

    for (const { listener, once } of listenersCopy) {
      try {
        // Execute listener and handle potential async result
        const result = listener(args);

        // Prevent unhandled promise rejections
        if (result && typeof result.then === 'function') {
          result.catch(error => {
            this.logger.error(`Unhandled async error in "${String(event)}" listener`, error);
          });
        }
      } catch (error) {
        this.logger.error(`Sync listener error for "${String(event)}"`, error);
      } finally {
        // Mark once listeners for removal
        if (once) {
          onceListenersToRemove.push(listener);
        }
      }
    }

    // Bulk remove once listeners after iteration
    if (onceListenersToRemove.length > 0) {
      this._listeners.set(
        event,
        listeners.filter(
          wrapper => !onceListenersToRemove.includes(wrapper.listener)
        )
      );
    }
  }

  /**
   * Asynchronously dispatches an event (parallel execution)
   * @param event - Event name to emit
   * @param args - Payload data for the event
   * @returns Promise that resolves when all listeners complete
   */
  async emitAsyncParallel<Event extends keyof Events>(
    event: Event,
    args: Events[Event]
  ): Promise<void> {
    this.validateEventName(event);

    const listeners = this._listeners.get(event);
    if (!listeners || listeners.length === 0) {
      this.logger.warn(`No listeners for event "${String(event)}" - ${JSON.stringify(args)}`);
      return;
    }

    const listenersCopy = [...listeners];
    const onceListenersToRemove: Listener<Events[Event]>[] = [];

    // Execute all listeners concurrently
    const promises = listenersCopy.map(async ({ listener, once }) => {
      try {
        await listener(args);
      } catch (error) {
        this.logger.error(`Parallel listener error for "${String(event)}"`, error);
      } finally {
        if (once) {
          onceListenersToRemove.push(listener);
        }
      }
    });

    // Wait for all executions to settle
    await Promise.allSettled(promises);

    // Cleanup once listeners
    if (onceListenersToRemove.length > 0) {
      this._listeners.set(
        event,
        listeners.filter(
          wrapper => !onceListenersToRemove.includes(wrapper.listener)
        )
      );
    }
  }

  /**
   * Asynchronously dispatches an event (sequential execution)
   * @param event - Event name to emit
   * @param args - Payload data for the event
   * @returns Promise that resolves when all listeners complete in order
   */
  async emitAsyncSeries<Event extends keyof Events>(
    event: Event,
    args: Events[Event]
  ): Promise<void> {
    this.validateEventName(event);

    const listeners = this._listeners.get(event);
    if (!listeners || listeners.length === 0) {
      this.logger.warn(`No listeners for event "${String(event)}" - ${JSON.stringify(args)}`);
      return;
    }

    const listenersCopy = [...listeners];
    const onceListenersToRemove: Listener<Events[Event]>[] = [];

    // Execute listeners in registration priority order
    for (const { listener, once } of listenersCopy) {
      try {
        await listener(args);
      } catch (error) {
        this.logger.error(`Series listener error for "${String(event)}"`, error);
      } finally {
        if (once) {
          onceListenersToRemove.push(listener);
        }
      }
    }

    // Cleanup once listeners
    if (onceListenersToRemove.length > 0) {
      this._listeners.set(
        event,
        listeners.filter(
          wrapper => !onceListenersToRemove.includes(wrapper.listener)
        )
      );
    }
  }

  /**
   * Validates event names against allowed set
   * @param event - Event name to validate
   */
  private validateEventName(event: keyof Events): void {
    if (this._allowedEvents && !this._allowedEvents.has(event)) {
      this.logger.warn(`Unexpected event name "${String(event)}"`);
    }
  }
}