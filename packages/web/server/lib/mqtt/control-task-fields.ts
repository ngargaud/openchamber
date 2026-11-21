import { asNonEmptyString, isString } from '../shared/guards.js';

type ControlMqttInput = {
  topic?: unknown;
  qos?: unknown;
  broker?: unknown;
  username?: unknown;
  password?: unknown;
  payloadTemplate?: unknown;
  topicTemplate?: unknown;
  handleRetained?: unknown;
  minIntervalMs?: unknown;
};

export type ControlMqttTask = {
  topic: string;
  qos?: 0 | 1 | 2;
  broker?: string;
  username?: string;
  password?: string;
  payloadTemplate?: string;
  topicTemplate?: string;
  handleRetained?: boolean;
  minIntervalMs?: number;
};

const qosOf = (value: ControlMqttInput['qos']): 0 | 1 | 2 | undefined => (
  value === 0 || value === 1 || value === 2 ? value : undefined
);

const finiteNumber = (value: ControlMqttInput['minIntervalMs']): value is number => Number.isFinite(value);

const passwordOf = (input: ControlMqttInput, existing: string | undefined): string | undefined => {
  if (!isString(input.password)) return existing;
  return input.password.trim() ? input.password : existing;
};

export const buildControlMqttTask = (input: ControlMqttInput): ControlMqttTask | undefined => {
  const topic = asNonEmptyString(input.topic);
  if (!topic) return undefined;
  const task: ControlMqttTask = { topic };
  const qos = qosOf(input.qos);
  const broker = asNonEmptyString(input.broker);
  const username = asNonEmptyString(input.username);
  const password = passwordOf(input, undefined);
  const payloadTemplate = asNonEmptyString(input.payloadTemplate);
  const topicTemplate = asNonEmptyString(input.topicTemplate);
  const minIntervalMs = finiteNumber(input.minIntervalMs) ? input.minIntervalMs : undefined;
  if (qos !== undefined) task.qos = qos;
  if (broker) task.broker = broker;
  if (username) task.username = username;
  if (password) task.password = password;
  if (payloadTemplate) task.payloadTemplate = payloadTemplate;
  if (topicTemplate) task.topicTemplate = topicTemplate;
  if (input.handleRetained === true) task.handleRetained = true;
  if (minIntervalMs !== undefined) task.minIntervalMs = minIntervalMs;
  return task;
};

export const patchControlMqttTask = (
  input: ControlMqttInput,
  existing: ControlMqttTask | undefined,
): ControlMqttTask | undefined => {
  if (input.topic === undefined) return existing;
  const topic = asNonEmptyString(input.topic);
  if (!topic) return undefined;
  const task: ControlMqttTask = { topic };
  const qos = qosOf(input.qos) ?? existing?.qos;
  const broker = asNonEmptyString(input.broker) ?? existing?.broker;
  const username = asNonEmptyString(input.username) ?? existing?.username;
  const password = passwordOf(input, existing?.password);
  const payloadTemplate = asNonEmptyString(input.payloadTemplate) ?? existing?.payloadTemplate;
  const topicTemplate = asNonEmptyString(input.topicTemplate) ?? existing?.topicTemplate;
  const handleRetained = input.handleRetained === true ? true : existing?.handleRetained;
  const minIntervalMs = existing?.minIntervalMs;
  if (qos !== undefined) task.qos = qos;
  if (broker) task.broker = broker;
  if (username) task.username = username;
  if (password) task.password = password;
  if (payloadTemplate) task.payloadTemplate = payloadTemplate;
  if (topicTemplate) task.topicTemplate = topicTemplate;
  if (handleRetained) task.handleRetained = handleRetained;
  if (minIntervalMs !== undefined) task.minIntervalMs = minIntervalMs;
  return task;
};
