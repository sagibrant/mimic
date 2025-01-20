/**
 * MsgDataHandlerBase.ts
 * The base class for handling message data
 * Author: Zhang Jie
 */

import { Rtid, Utils } from "../Common";
import { Logger } from "../Logger";
import { MessageData } from "./Message";

/**
 * Callback type for delivering handler results
 */
export type ResultCallback = (result: MessageData) => void;

/**
 * The base class for handling communication messages
 */
export abstract class MsgDataHandlerBase {
  readonly id: Rtid;
  protected logger: Logger;

  constructor(id: Rtid) {
    this.id = id;

    const prefix = Utils.isEmpty(this.constructor?.name) ? "MsgDataHandlerBase" : this.constructor?.name;
    this.logger = new Logger(prefix);
  }

  /**
   * Handles a message and invokes a result callback when done.
   * @param msg - The incoming message data.
   * @param resultCallback - Callback to return results.
   */
  abstract handle(data: MessageData, resultCallback?: ResultCallback): boolean;
}
