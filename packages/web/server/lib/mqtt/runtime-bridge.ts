import { mqttClient } from './client.js';
import { createMqttTriggerManager } from './trigger-manager.js';
import type { MqttLogger, MqttTasksRuntime } from './types.js';
import type { MqttTriggerManager } from './trigger-manager.js';

export type MqttRuntimeBridge = {
  initialize: (scheduledTasksRuntime: MqttTasksRuntime) => void;
  onTasksChanged: () => void;
  reconcile: () => void;
};

export const createMqttRuntimeBridge = (logger: MqttLogger): MqttRuntimeBridge => {
  let manager: MqttTriggerManager | null = null;

  return {
    initialize: (scheduledTasksRuntime) => {
      try {
        manager = createMqttTriggerManager({ mqttClient, scheduledTasksRuntime, logger });
      } catch (error) {
        logger.warn('[mqtt-triggers] failed to initialize:', String(error));
      }
    },
    onTasksChanged: () => {
      try {
        manager?.reconcile();
      } catch (error) {
        void error;
      }
    },
    reconcile: () => {
      try {
        manager?.reconcile();
        setInterval(() => {
          try {
            manager?.reconcile();
          } catch (error) {
            void error;
          }
        }, 10_000).unref?.();
      } catch (error) {
        void error;
      }
    },
  };
};
