import type { ScheduledTask } from '@/lib/scheduledTasksApi';
import type { I18nKey, I18nParams } from '@/lib/i18n';
import { isValidCronExpression } from '@/lib/cron';
import { canonicalizeTimezone } from '@/lib/timezones';

export type ScheduledTaskDraft = {
  id?: string;
  sessionMode: 'new' | 'existing';
  targetSessionId: string;
  name: string;
  enabled: boolean;
  triggerType: 'schedule' | 'mqtt';
  schedule: {
    kind: 'daily' | 'weekly' | 'once' | 'cron';
    times: string[];
    onceDate: string;
    onceTime: string;
    weekdays: number[];
    timezone: string;
    cronExpression: string;
  };
  mqtt: {
    topic: string;
    qos: 0 | 1 | 2;
    broker: string;
    username: string;
    password: string;
    payloadTemplate: string;
    topicTemplate: string;
    handleRetained: boolean;
    minIntervalMs: number;
  };
  execution: {
    prompt: string;
    providerID: string;
    modelID: string;
    variant: string;
    agent: string;
    useDefaults: boolean;
    goalEnabled: boolean;
    goalTokenBudget: number | null;
    permissionAutoAccept: boolean;
  };
  runInWorktree: boolean;
  baseBranch: string;
  cleanupWorktree: boolean;
  state?: ScheduledTask['state'];
};

const normalizeDraftTimes = (task: ScheduledTask | null): string[] => {
  if (!task || !task.schedule) {
    return ['09:00'];
  }
  const candidates = Array.isArray(task.schedule?.times)
    ? task.schedule.times
    : (task.schedule?.time ? [task.schedule.time] : []);

  const valid = candidates
    .filter((value) => typeof value === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(value))
    .map((value) => value.trim());

  const unique = Array.from(new Set(valid)).sort((a, b) => a.localeCompare(b));
  return unique.length > 0 ? unique : ['09:00'];
};

export const toDraft = (
  task: ScheduledTask | null,
  defaults: {
    providerID: string;
    modelID: string;
    variant: string;
    agent: string;
  },
): ScheduledTaskDraft => {
  const timezoneFallback = canonicalizeTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
  if (!task) {
    return {
      name: '',
      sessionMode: 'new',
      targetSessionId: '',
      enabled: true,
      triggerType: 'schedule',
      schedule: {
        kind: 'daily',
        times: ['09:00'],
        onceDate: getLocalDateISO(),
        onceTime: '09:00',
        weekdays: [1],
        timezone: timezoneFallback,
        cronExpression: '',
      },
      mqtt: {
        topic: '',
        qos: 0,
        broker: '',
        username: '',
        password: '',
        payloadTemplate: '',
        topicTemplate: '',
        handleRetained: false,
        minIntervalMs: 0,
      },
      execution: {
        prompt: '',
        providerID: defaults.providerID,
        modelID: defaults.modelID,
        variant: defaults.variant,
        agent: defaults.agent,
        useDefaults: false,
        goalEnabled: false,
        goalTokenBudget: null,
        permissionAutoAccept: false,
      },
      runInWorktree: false,
      baseBranch: '',
      cleanupWorktree: true,
    };
  }

  return {
    id: task.id,
    sessionMode: task.targetSessionId ? 'existing' : 'new',
    targetSessionId: task.targetSessionId || '',
    name: task.name,
    enabled: task.enabled,
    triggerType: task.mqtt ? 'mqtt' : 'schedule',
    schedule: {
      kind: task.schedule?.kind === 'cron'
        ? 'cron'
        : (task.schedule?.kind === 'once'
          ? 'once'
          : (task.schedule?.kind === 'weekly' ? 'weekly' : 'daily')),
      times: normalizeDraftTimes(task),
      onceDate: typeof task.schedule?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(task.schedule.date)
        ? task.schedule.date
        : getLocalDateISO(),
      onceTime: typeof task.schedule?.time === 'string' && /^([01]\d|2[0-3]):([0-5]\d)$/.test(task.schedule.time)
        ? task.schedule.time
        : '09:00',
      weekdays: Array.isArray(task.schedule?.weekdays) ? task.schedule?.weekdays : [1],
      timezone: canonicalizeTimezone(task.schedule?.timezone || timezoneFallback),
      cronExpression: task.schedule?.kind === 'cron' && typeof task.schedule?.cron === 'string'
        ? task.schedule.cron
        : '',
    },
    mqtt: {
      topic: task.mqtt?.topic || '',
      qos: (task.mqtt?.qos === 1 || task.mqtt?.qos === 2) ? task.mqtt.qos : 0,
      broker: task.mqtt?.broker || '',
      username: task.mqtt?.username || '',
      password: task.mqtt?.password || '',
      payloadTemplate: task.mqtt?.payloadTemplate || '',
      topicTemplate: task.mqtt?.topicTemplate || '',
      handleRetained: task.mqtt?.handleRetained === true,
      minIntervalMs: typeof task.mqtt?.minIntervalMs === 'number' ? task.mqtt.minIntervalMs : 0,
    },
    execution: {
      prompt: task.execution.prompt,
      providerID: task.execution.providerID || defaults.providerID,
      modelID: task.execution.modelID || defaults.modelID,
      variant: task.execution.variant || '',
      agent: task.execution.agent || '',
      useDefaults: task.execution.useDefaults === true,
      goalEnabled: task.execution.goalEnabled === true,
      goalTokenBudget: typeof task.execution.goalTokenBudget === 'number' && task.execution.goalTokenBudget > 0
        ? task.execution.goalTokenBudget
        : null,
      permissionAutoAccept: task.execution.permissionAutoAccept === true,
    },
    runInWorktree: task.runInWorktree === true,
    baseBranch: task.baseBranch || '',
    cleanupWorktree: task.cleanupWorktree !== false,
    state: task.state,
  };
};

export const validateDraft = (draft: ScheduledTaskDraft, t: (key: I18nKey, params?: I18nParams) => string): string | null => {
  if (draft.sessionMode === 'existing' && !draft.targetSessionId) return t('sessions.scheduledTasks.editor.targetRequired');
  if (!draft.name.trim()) {
    return t('sessions.scheduledTasks.editor.validation.taskNameRequired');
  }
  if (!draft.execution.prompt.trim()) {
    return t('sessions.scheduledTasks.editor.validation.promptRequired');
  }
  if (!draft.execution.useDefaults && (!draft.execution.providerID.trim() || !draft.execution.modelID.trim())) {
    return t('sessions.scheduledTasks.editor.validation.modelRequired');
  }
  if (draft.triggerType === 'mqtt') {
    if (!draft.mqtt.topic.trim()) {
      return t('sessions.scheduledTasks.editor.validation.topicRequired');
    }
    return null;
  }

  if (draft.schedule.kind === 'once') {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.schedule.onceDate)) {
      return t('sessions.scheduledTasks.editor.validation.dateFormat');
    }
    if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(draft.schedule.onceTime)) {
      return t('sessions.scheduledTasks.editor.validation.timeFormat');
    }
  } else if (draft.schedule.kind === 'cron') {
    if (!draft.schedule.cronExpression.trim()) {
      return t('sessions.scheduledTasks.editor.validation.cronRequired');
    }
    const cronResult = isValidCronExpression(draft.schedule.cronExpression);
    if (!cronResult.valid) {
      return t('sessions.scheduledTasks.editor.validation.cronInvalid');
    }
  } else {
    const validTimes = draft.schedule.times.filter((value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value));
    if (validTimes.length === 0) {
      return t('sessions.scheduledTasks.editor.validation.atLeastOneTime');
    }
  }

  if (draft.schedule.kind === 'weekly' && draft.schedule.weekdays.length === 0) {
    return t('sessions.scheduledTasks.editor.validation.atLeastOneWeekday');
  }

  if (!draft.schedule.timezone.trim()) {
    return t('sessions.scheduledTasks.editor.validation.timezoneRequired');
  }

  return null;
};

const dedupeSortTimes = (times: string[]) => {
  const filtered = times.filter((value) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value));
  return Array.from(new Set(filtered)).sort((a, b) => a.localeCompare(b));
};

const buildMqttPayload = (draft: ScheduledTaskDraft): NonNullable<ScheduledTask['mqtt']> => {
  const mqtt: NonNullable<ScheduledTask['mqtt']> = {
    topic: draft.mqtt.topic.trim(),
    qos: draft.mqtt.qos,
    handleRetained: draft.mqtt.handleRetained,
    dedup: true,
  };
  if (draft.mqtt.broker.trim()) mqtt.broker = draft.mqtt.broker.trim();
  if (draft.mqtt.username.trim()) mqtt.username = draft.mqtt.username.trim();
  if (draft.mqtt.password) mqtt.password = draft.mqtt.password;
  if (draft.mqtt.payloadTemplate.trim()) mqtt.payloadTemplate = draft.mqtt.payloadTemplate.trim();
  if (draft.mqtt.topicTemplate.trim()) mqtt.topicTemplate = draft.mqtt.topicTemplate.trim();
  if (draft.mqtt.minIntervalMs > 0) mqtt.minIntervalMs = draft.mqtt.minIntervalMs;
  return mqtt;
};

export const buildScheduledTaskPayload = (draft: ScheduledTaskDraft): Partial<ScheduledTask> => {
  const payload: Partial<ScheduledTask> = {
    ...(draft.id ? { id: draft.id } : {}),
    name: draft.name.trim(),
    targetSessionId: draft.sessionMode === 'existing' ? draft.targetSessionId : '',
    enabled: draft.enabled,
    ...(draft.triggerType === 'mqtt'
      ? {
          mqtt: buildMqttPayload(draft),
        }
      : {
          schedule: {
            kind: draft.schedule.kind,
            timezone: draft.schedule.timezone.trim(),
            ...(draft.schedule.kind === 'cron'
              ? { cron: draft.schedule.cronExpression.trim() }
              : draft.schedule.kind === 'once'
                ? {
                    date: draft.schedule.onceDate,
                    time: draft.schedule.onceTime,
                }
                : {
                    times: dedupeSortTimes(draft.schedule.times),
                    ...(draft.schedule.kind === 'weekly' ? { weekdays: draft.schedule.weekdays } : {}),
                  }),
          },
        }),
    execution: {
      prompt: draft.execution.prompt,
      ...(draft.execution.useDefaults ? { useDefaults: true } : {}),
      providerID: draft.execution.providerID,
      modelID: draft.execution.modelID,
      ...(draft.execution.variant.trim() ? { variant: draft.execution.variant.trim() } : {}),
      ...(draft.execution.agent.trim() ? { agent: draft.execution.agent.trim() } : {}),
      ...(draft.execution.permissionAutoAccept ? { permissionAutoAccept: true } : {}),
      ...(draft.execution.goalEnabled ? { goalEnabled: true } : {}),
      ...(draft.execution.goalEnabled && draft.execution.goalTokenBudget
        ? { goalTokenBudget: draft.execution.goalTokenBudget }
        : {}),
    },
  };
  if (draft.sessionMode === 'new') {
    payload.runInWorktree = draft.runInWorktree;
    payload.baseBranch = draft.baseBranch.trim();
    payload.cleanupWorktree = draft.cleanupWorktree;
  }
  return payload;
};

function getLocalDateISO(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
