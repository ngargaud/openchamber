import { readMqttBrokers } from '@/lib/mqttBrokers';
import type { ScheduledTaskDraft } from './scheduledTaskEditorDraft';

export const applyDefaultMqttBroker = (
  draft: ScheduledTaskDraft,
  mode: 'scheduled' | 'event',
): ScheduledTaskDraft => {
  if (mode !== 'event' || draft.mqtt.broker.trim()) return draft;
  const [first] = readMqttBrokers();
  if (!first) return draft;
  return {
    ...draft,
    mqtt: {
      ...draft.mqtt,
      broker: first.url,
      username: first.username,
      password: first.password,
    },
  };
};
