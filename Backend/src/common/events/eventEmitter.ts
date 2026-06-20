import EventEmitter from 'events';

/**
 * Global EventEmitter singleton.
 *
 * Currently uses Node.js built-in EventEmitter.
 * To migrate to Kafka/RabbitMQ in the future, replace this
 * singleton's emit/on with MQ publish/subscribe — service
 * call sites remain unchanged.
 */
class ERPEventEmitter extends EventEmitter {
  private static instance: ERPEventEmitter;

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  static getInstance(): ERPEventEmitter {
    if (!ERPEventEmitter.instance) {
      ERPEventEmitter.instance = new ERPEventEmitter();
    }
    return ERPEventEmitter.instance;
  }
}

export const eventEmitter = ERPEventEmitter.getInstance();
