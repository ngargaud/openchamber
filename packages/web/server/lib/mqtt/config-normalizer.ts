import { z } from 'zod';
import type { ScheduledTaskMqttTrigger } from '../projects/contracts.js';

const MAX_TOPIC_LENGTH = 512;
const MAX_TASK_PROMPT_LENGTH = 20_000;

const mqttSchema = z.object({
  topic: z.string().optional(),
  qos: z.union([z.literal(0), z.literal(1), z.literal(2)]).optional(),
  broker: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  payloadTemplate: z.string().optional(),
  topicTemplate: z.string().optional(),
  handleRetained: z.boolean().optional(),
  minIntervalMs: z.number().finite().min(0).optional(),
  dedup: z.boolean().optional(),
});

type MqttInputValue = Parameters<typeof mqttSchema.safeParse>[0] | undefined;

const clampLength = (value: string, maxLength: number) => (
  value.length > maxLength ? value.slice(0, maxLength) : value
);

const trimmed = (value: string | undefined): string | undefined => {
  const result = value?.trim();
  return result ? result : undefined;
};

export const normalizeMqttTrigger = (
  value: MqttInputValue,
  existing: ScheduledTaskMqttTrigger | undefined,
): ScheduledTaskMqttTrigger | undefined => {
  if (value == null) return existing;
  const parsed = mqttSchema.safeParse(value);
  if (!parsed.success) throw new Error('mqtt must be an object');
  const data = parsed.data;
  const topic = clampLength(trimmed(data.topic) ?? '', MAX_TOPIC_LENGTH);
  if (!topic) throw new Error('mqtt.topic is required');

  const result: ScheduledTaskMqttTrigger = {
    topic,
    qos: data.qos ?? 0,
    handleRetained: data.handleRetained === true,
    dedup: data.dedup === false ? false : true,
  };
  const broker = trimmed(data.broker);
  const username = trimmed(data.username);
  const password = data.password;
  const payloadTemplate = clampLength(trimmed(data.payloadTemplate) ?? '', MAX_TASK_PROMPT_LENGTH);
  const topicTemplate = clampLength(trimmed(data.topicTemplate) ?? '', MAX_TASK_PROMPT_LENGTH);
  const minIntervalMs = data.minIntervalMs === undefined ? undefined : Math.floor(data.minIntervalMs);
  if (broker) result.broker = broker;
  if (username) result.username = username;
  if (password) result.password = password;
  if (payloadTemplate) result.payloadTemplate = payloadTemplate;
  if (topicTemplate) result.topicTemplate = topicTemplate;
  if (minIntervalMs !== undefined) result.minIntervalMs = minIntervalMs;
  return result;
};
