import { describe, expect, it } from 'vitest';
import { createMqttTriggerManager } from './trigger-manager.js';
import type {
  MqttClientApi,
  MqttSubscriptionOptions,
  MqttTaskConfig,
  MqttTaskEntry,
} from './types.js';

type SubscribeCall = {
  brokerUrl: string;
  topic: string;
  options: MqttSubscriptionOptions;
};

const createHarness = (tasks: MqttTaskEntry[]) => {
  const calls: SubscribeCall[] = [];
  const mqttClient: MqttClientApi = {
    isAvailable: () => true,
    subscribe: (brokerUrl, topic, _handler, options) => {
      calls.push({ brokerUrl, topic, options: options ?? {} });
      return () => undefined;
    },
    testConnection: async () => ({ ok: true }),
  };
  const scheduledTasksRuntime: Parameters<typeof createMqttTriggerManager>[0]['scheduledTasksRuntime'] = {
    listMqttTasks: () => tasks,
    triggerTask: async () => ({ ok: true }),
  };
  const logger: Pick<Console, 'log' | 'warn'> = { log: () => undefined, warn: () => undefined };
  const manager = createMqttTriggerManager({ mqttClient, scheduledTasksRuntime, logger });
  return { calls, manager };
};

const taskEntry = (id: string, mqtt: MqttTaskConfig): MqttTaskEntry => ({
  projectID: 'project-1',
  task: { id, name: id, mqtt },
});

describe('mqtt trigger manager subscriptions', () => {
  it('groups tasks that share a broker, topic and identity and uses the highest QoS', () => {
    const { calls, manager } = createHarness([
      taskEntry('task-1', { topic: 'events/#', broker: 'ws://mqtt:1883', username: 'reader', password: 'test', qos: 0 }),
      taskEntry('task-2', { topic: 'events/#', broker: 'ws://mqtt:1883', username: 'reader', password: 'test', qos: 2 }),
    ]);
    manager.reconcile();
    expect(calls).toHaveLength(1);
    expect(calls[0]).toMatchObject({
      brokerUrl: 'ws://mqtt:1883',
      topic: 'events/#',
      options: { username: 'reader', password: 'test', qos: 2 },
    });
  });

  it('does not reuse one task identity for another task on the same topic', () => {
    const { calls, manager } = createHarness([
      taskEntry('task-1', { topic: 'events/#', broker: 'ws://mqtt:1883', username: 'reader', password: 'test' }),
      taskEntry('task-2', { topic: 'events/#', broker: 'ws://mqtt:1883', username: 'writer', password: 'other' }),
    ]);
    manager.reconcile();
    expect(calls).toHaveLength(2);
    expect(calls.map((call) => call.options.username)).toEqual(['reader', 'writer']);
    expect(calls.map((call) => call.options.password)).toEqual(['test', 'other']);
  });
});
