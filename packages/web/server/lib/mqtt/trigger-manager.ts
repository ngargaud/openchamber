import { asNonEmptyString } from '../shared/guards.js';
import type {
  MqttClientApi,
  MqttLogger,
  MqttQos,
  MqttTask,
  MqttTaskEntry,
  MqttTasksRuntime,
} from './types.js';

const DEFAULT_BROKER = process.env.OPENCHAMBER_MQTT_URL || process.env.MQTT_URL || 'mqtt://localhost:1883';
const DEDUP_TTL_MS = 60_000;
const MIN_INTERVAL_DEFAULT = 0;

const isFiniteNumber = (value: unknown): value is number => Number.isFinite(value);

const topicKey = (projectID: string, taskID: string, topic: string, payload: string) => `${projectID}:${taskID}:${topic}:${payload}`;

type TriggerManagerDependencies = {
  mqttClient: MqttClientApi;
  scheduledTasksRuntime: MqttTasksRuntime;
  logger?: MqttLogger;
};

type SubscriptionGroup = {
  brokerUrl: string;
  topic: string;
  username: string | undefined;
  password: string | undefined;
  qos: MqttQos;
  tasks: Set<MqttTaskEntry>;
};

type ActiveSubscription = SubscriptionGroup & {
  unsubscribe: () => void;
};

export const createMqttTriggerManager = (deps: TriggerManagerDependencies) => {
  const { mqttClient, scheduledTasksRuntime, logger = console } = deps;

  const active = new Map<string, ActiveSubscription>();
  const recent = new Map<string, number>();
  const lastTriggeredAt = new Map<string, number>();

  const pruneRecent = () => {
    const now = Date.now();
    for (const [key, timestamp] of recent.entries()) {
      if (now - timestamp > DEDUP_TTL_MS) recent.delete(key);
    }
  };

  const brokerForTask = (task: MqttTask) => asNonEmptyString(task.mqtt?.broker) || DEFAULT_BROKER;
  const usernameForTask = (task: MqttTask) => asNonEmptyString(task.mqtt?.username)
    || asNonEmptyString(process.env.OPENCHAMBER_MQTT_USERNAME)
    || asNonEmptyString(process.env.MQTT_USERNAME)
    || undefined;
  const passwordForTask = (task: MqttTask) => asNonEmptyString(task.mqtt?.password)
    || asNonEmptyString(process.env.OPENCHAMBER_MQTT_PASSWORD)
    || asNonEmptyString(process.env.MQTT_PASSWORD)
    || undefined;
  const qosForTask = (task: MqttTask): MqttQos => task.mqtt?.qos === 1 || task.mqtt?.qos === 2 ? task.mqtt.qos : 0;
  const higherQos = (a: MqttQos, b: MqttQos): MqttQos => a > b ? a : b;
  const subscriptionKey = (group: Omit<SubscriptionGroup, 'qos' | 'tasks'>) => (
    JSON.stringify([group.brokerUrl, group.topic, group.username ?? null, group.password ?? null])
  );

  const handle = (projectID: string, task: MqttTask, event: { topic: string; payload: string; retained: boolean }) => {
    logger.log(`[mqtt-triggers] message received on ${event.topic} -> task ${task.id} (${task.name})`);
    const taskKey = `${projectID}:${task.id}`;
    const config = task.mqtt;
    if (event.retained && config?.handleRetained !== true) return;

    const minInterval = isFiniteNumber(config?.minIntervalMs) ? config.minIntervalMs : MIN_INTERVAL_DEFAULT;
    const last = lastTriggeredAt.get(taskKey) || 0;
    if (minInterval > 0 && Date.now() - last < minInterval) return;

    if (config?.dedup !== false) {
      pruneRecent();
      const key = topicKey(projectID, task.id, event.topic, event.payload);
      if (recent.has(key)) return;
      recent.set(key, Date.now());
    }

    lastTriggeredAt.set(taskKey, Date.now());
    try {
      scheduledTasksRuntime.triggerTask(projectID, task.id, 'mqtt', event.payload, event.topic)
        .catch((error) => logger.warn('[mqtt-triggers] trigger failed', { projectID, taskID: task.id, error: String(error) }));
    } catch (error) {
      logger.warn('[mqtt-triggers] trigger failed', { projectID, taskID: task.id, error: String(error) });
    }
  };

  const reconcile = () => {
    if (!mqttClient.isAvailable()) {
      logger.warn('[mqtt-triggers] mqtt client unavailable; skipping reconcile');
      return;
    }

    const desired = new Map<string, SubscriptionGroup>();
    for (const entry of scheduledTasksRuntime.listMqttTasks()) {
      const topic = entry.task.mqtt?.topic;
      if (!topic) continue;
      const group = {
        brokerUrl: brokerForTask(entry.task),
        topic,
        username: usernameForTask(entry.task),
        password: passwordForTask(entry.task),
      };
      const key = subscriptionKey(group);
      const existing = desired.get(key);
      if (existing) {
        existing.tasks.add(entry);
        existing.qos = higherQos(existing.qos, qosForTask(entry.task));
        continue;
      }
      desired.set(key, { ...group, qos: qosForTask(entry.task), tasks: new Set([entry]) });
    }

    for (const [key, entry] of Array.from(active.entries())) {
      const group = desired.get(key);
      if (group && group.qos === entry.qos) continue;
      logger.log(`[mqtt-triggers] unsubscribing ${entry.topic} on ${entry.brokerUrl}`);
      try {
        entry.unsubscribe();
      } catch (error) { void error; }
      active.delete(key);
    }

    for (const [key, group] of desired.entries()) {
      const existing = active.get(key);
      if (existing) {
        existing.tasks = group.tasks;
        continue;
      }
      logger.log(`[mqtt-triggers] subscribing to ${group.topic} on ${group.brokerUrl} (${group.tasks.size} task(s))`);
      const unsubscribe = mqttClient.subscribe(
        group.brokerUrl,
        group.topic,
        (event) => {
          const entry = active.get(key);
          if (!entry) return;
          for (const { projectID, task } of entry.tasks) {
            handle(projectID, task, event);
          }
        },
        {
          qos: group.qos,
          username: group.username,
          password: group.password,
        },
      );
      active.set(key, { ...group, unsubscribe });
    }
  };

  const stop = () => {
    for (const entry of active.values()) {
      try {
        entry.unsubscribe();
      } catch (error) { void error; }
    }
    active.clear();
  };

  return { reconcile, stop };
};

export type MqttTriggerManager = ReturnType<typeof createMqttTriggerManager>;
