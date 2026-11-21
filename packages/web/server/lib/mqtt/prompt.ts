import { isRecord, isString } from '../shared/guards.js';
import type { JsonObject, JsonValue } from '../shared/json-values.js';
import type { MqttTaskConfig } from './types.js';

type PayloadObject = JsonObject | JsonValue[] | null;

const isJsonObject = (value: JsonValue | undefined): value is JsonObject => value !== null && value !== undefined && isRecord(value) && !Array.isArray(value);
const isJsonArray = (value: JsonValue | undefined): value is JsonValue[] => Array.isArray(value);
const isFiniteNumber = (value: unknown): value is number => Number.isFinite(value);
const isBoolean = (value: unknown): value is boolean => value === true || value === false;

export const parsePayloadObject = (payload: JsonValue): PayloadObject => {
  if (isJsonObject(payload) || isJsonArray(payload)) return payload;
  if (!isString(payload)) return null;
  const trimmed = payload.trim();
  if (!trimmed) return null;
  try {
    const parsed: JsonValue = JSON.parse(trimmed);
    return isJsonObject(parsed) || isJsonArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const resolvePayloadPath = (payloadObj: PayloadObject, path: string): JsonValue | undefined => {
  if (!payloadObj || !path) return undefined;
  const parts = path.split('.').filter(Boolean);
  let current: JsonValue | undefined = payloadObj;
  for (const part of parts) {
    if (isJsonObject(current)) {
      current = current[part];
    } else if (isJsonArray(current)) {
      current = current[Number(part)];
    } else {
      return undefined;
    }
  }
  return current;
};

export const stringifyValue = (value: JsonValue | undefined): string => {
  if (value == null) return '';
  if (isString(value)) return value;
  if (isFiniteNumber(value) || isBoolean(value)) return String(value);
  return JSON.stringify(value) ?? String(value);
};

export const renderTemplateString = (
  template: JsonValue,
  rawPayload: string,
  rawTopic: string,
  payloadObj: PayloadObject,
  payloadOverride: string | null,
  topicOverride: string | null,
): JsonValue => {
  if (!isString(template)) return template;
  const withPayload = template.replace(/\{\{\s*(payload(?:\.[a-zA-Z0-9_]+)*)\s*\}\}/g, (_match, expression: string) => {
    const path = expression === 'payload' ? '' : expression.slice('payload.'.length);
    if (!path) return payloadOverride ?? rawPayload;
    const value = resolvePayloadPath(payloadObj, path);
    return value === undefined ? '' : stringifyValue(value);
  });
  return withPayload.replace(/\{\{\s*topic\s*\}\}/g, () => topicOverride ?? rawTopic);
};

export const renderMqttPromptText = (
  prompt: string,
  payload: JsonValue,
  topic: string,
  config: Partial<MqttTaskConfig> = {},
): string => {
  const rendered = renderMqttPrompt(prompt, payload, topic, config);
  return isString(rendered) ? rendered : prompt;
};

export const renderMqttPrompt = (
  prompt: JsonValue,
  payload: JsonValue,
  topic: JsonValue,
  config: Partial<MqttTaskConfig> = {},
): JsonValue => {
  if (!isString(prompt)) return prompt;
  const rawPayload = payload == null ? '' : isString(payload) ? payload : stringifyValue(payload);
  const rawTopic = topic == null ? '' : isString(topic) ? topic : stringifyValue(topic);
  const payloadObj = parsePayloadObject(payload);

  let payloadOverride: string | null = null;
  if (isString(config.payloadTemplate) && config.payloadTemplate.trim()) {
    const rendered = renderTemplateString(config.payloadTemplate, rawPayload, rawTopic, payloadObj, null, null);
    payloadOverride = isString(rendered) ? rendered : null;
  }

  let topicOverride: string | null = null;
  if (isString(config.topicTemplate) && config.topicTemplate.trim()) {
    const rendered = renderTemplateString(config.topicTemplate, rawPayload, rawTopic, payloadObj, null, null);
    topicOverride = isString(rendered) ? rendered : null;
  }

  return renderTemplateString(prompt, rawPayload, rawTopic, payloadObj, payloadOverride, topicOverride);
};
