import type { I18nKey, I18nParams } from '@/lib/i18n';
import type { ScheduledTask } from '@/lib/scheduledTasksApi';
import { formatSchedule } from './scheduledTaskSchedule';

type Translation = (key: I18nKey, params?: I18nParams) => string;

export const filterTasksByMode = (tasks: ScheduledTask[], mode: 'scheduled' | 'event'): ScheduledTask[] => (
  mode === 'event'
    ? tasks.filter((task) => Boolean(task.mqtt))
    : tasks.filter((task) => !task.mqtt)
);

export const formatTaskSummary = (task: ScheduledTask, t: Translation): string => {
  if (!task.mqtt) return formatSchedule(task.schedule, t);
  return t('sessions.scheduledTasks.dialog.mqttSummary', {
    topic: task.mqtt.topic || '—',
    broker: task.mqtt.broker || '',
  });
};
