import { readMqttBrokers } from '@/lib/mqttBrokers';
import type { ScheduledTaskDraft } from './scheduledTaskEditorDraft';

export const applyDefaultMqttBroker = async (
  draft: ScheduledTaskDraft,
  mode: 'scheduled' | 'event',
): Promise<ScheduledTaskDraft> => {
  if (mode !== 'event' || draft.mqtt.broker.trim()) return draft;
  let brokers: Awaited<ReturnType<typeof readMqttBrokers>> = [];
  try {
    brokers = await readMqttBrokers();
  } catch {
    brokers = [];
  }
  const [first] = brokers;
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