/**
 * Message.ts
 * Defines automation message related structures.
 * Author: Zhang Jie
 */

import { Rtid, Utils } from "./../Common";

// ------------------------
// Type Definitions
// ------------------------

export type MessageType = "event" | "request" | "response";
export type ActionType = "query" | "execute" | "record" | "config";

// ------------------------
// Interfaces
// ------------------------

export interface Action {
  name: string;
  params: Record<string, unknown>;
}

export interface AODescription {
  selectors?: Record<string, string>;
}

export interface AutomationObject {
  description?: AODescription;
  rtid?: Rtid;
  children?: AutomationObject[];
}

// ------------------------
// MessageData Class
// ------------------------

export class MessageData {
  type: ActionType;
  action: Action;
  dest: Rtid;

  automationObj?: AutomationObject;
  status?: 'OK' | 'ERROR';

  constructor(
    type: ActionType,
    action: Action,
    dest: Rtid,
    automationObj?: AutomationObject
  ) {
    this.type = type;
    this.action = action;
    this.dest = dest;
    this.automationObj = automationObj;
  }
}

// ------------------------
// Message Class
// ------------------------

export class Message {
  type: MessageType;
  uid: string;
  data: MessageData;

  constructor(
    type: MessageType,
    data: MessageData,
    uid: string = Utils.generateUUID()
  ) {
    this.type = type;
    this.uid = uid;
    this.data = data;
  }


  /**
   * Serialize to JSON string
   */
  toJSON(): string {
    return JSON.stringify({
      type: this.type,
      uid: this.uid,
      data: this.data,
    });
  }

  /**
   * Create Msg from JSON string
   */
  static fromJSON(jsonStr: string): Message | null {
    try {
      const obj = JSON.parse(jsonStr);
      if (!obj.type || !obj.uid) return null;

      const msg = new Message(obj.type, obj.data, obj.uid);
      return msg;
    } catch {
      return null;
    }
  }

  /**
   * Validate Msg structure
   */
  static isValid(msg: Message): boolean {
    return (
      typeof msg.type === "string" &&
      typeof msg.uid === "string" &&
      msg.data instanceof MessageData
    );
  }
}
