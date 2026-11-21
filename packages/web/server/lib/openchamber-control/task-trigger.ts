import { asNonEmptyString } from '../shared/guards.js';
import {
  buildControlMqttTask,
  patchControlMqttTask,
  type ControlMqttTask,
} from '../mqtt/control-task-fields.js';
import type { ControlInput } from './contracts.js';
import { OpenChamberControlError } from './error.js';

export type TaskSchedule =
  | { kind: 'daily'; times: string[]; timezone?: string }
  | { kind: 'weekly'; times: string[]; weekdays: number[]; timezone?: string }
  | { kind: 'once'; date: string; time: string; timezone?: string }
  | { kind: 'cron'; cron: string | null; timezone?: string };

export type TriggerFields = {
  schedule?: TaskSchedule | undefined;
  mqtt?: ControlMqttTask | undefined;
};

type ExistingTrigger = TriggerFields;

const SELECTORS = ['daily', 'weekly', 'once', 'cron'] as const;
const TIME_ERROR = 'time requires a once or single-time weekly schedule; provide an explicit schedule to replace other schedules';

export const buildTaskTrigger = (
  input: ControlInput,
  buildSchedule: (input: ControlInput) => TaskSchedule,
): TriggerFields => {
  const mqtt = buildControlMqttTask(input);
  return mqtt ? { mqtt } : { schedule: buildSchedule(input) };
};

export const patchTaskTrigger = (
  input: ControlInput,
  existing: ExistingTrigger,
  buildSchedule: (input: ControlInput) => TaskSchedule,
): TriggerFields => {
  const selectors = SELECTORS.filter((key) => input[key] !== undefined);
  if (selectors.length > 1 || (selectors.length === 1 && !asNonEmptyString(input[selectors[0] ?? 'daily']))) {
    throw new OpenChamberControlError('Provide exactly one nonempty daily, weekly, once, cron, or topic selector', 400);
  }
  const hasScheduleInput = selectors.length === 1;
  const hasTopicInput = input.topic !== undefined;
  const timezone = asNonEmptyString(input.timezone);
  let schedule: TaskSchedule | undefined = hasTopicInput && !hasScheduleInput
    ? undefined
    : hasScheduleInput
      ? buildSchedule(input)
      : timezone && existing.schedule
        ? { ...existing.schedule, timezone }
        : existing.schedule;
  const mqtt = hasScheduleInput && !hasTopicInput
    ? undefined
    : patchControlMqttTask(input, existing.mqtt);
  if (input.time !== undefined) {
    const time = asNonEmptyString(input.time);
    if (!time || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new OpenChamberControlError('time must be HH:mm', 400);
    if (!schedule) throw new OpenChamberControlError(TIME_ERROR, 400);
    if (schedule.kind === 'once') schedule = { ...schedule, time };
    else if (schedule.kind === 'weekly' && schedule.times.length === 1) schedule = { ...schedule, times: [time] };
    else throw new OpenChamberControlError(TIME_ERROR, 400);
  }
  return { schedule, mqtt };
};
