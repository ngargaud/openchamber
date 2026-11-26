import { z } from 'zod';
import { runtimeFetch } from '@/lib/runtime-fetch';

const brokerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  username: z.string().catch(''),
  password: z.string().catch(''),
});

export type MqttBroker = z.infer<typeof brokerSchema>;

const brokerListSchema = z.array(brokerSchema);

const MQTT_BROKERS_STORAGE_KEY = 'openchamber.mqtt.brokers';
const BROKERS_URL = '/api/openchamber/mqtt/brokers';

const readCachedBrokers = (): MqttBroker[] => {
  try {
    const raw = localStorage.getItem(MQTT_BROKERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = brokerListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch {
    return [];
  }
};

const writeCachedBrokers = (brokers: MqttBroker[]): void => {
  try {
    localStorage.setItem(MQTT_BROKERS_STORAGE_KEY, JSON.stringify(brokers));
  } catch {
    void 0;
  }
};

export const readMqttBrokers = async (): Promise<MqttBroker[]> => {
  try {
    const response = await runtimeFetch(BROKERS_URL, { method: 'GET', headers: { Accept: 'application/json' } });
    if (response.ok) {
      const data = await response.json().catch(() => null);
      const parsed = brokerListSchema.safeParse(data);
      if (parsed.success) {
        const cached = readCachedBrokers();
        // Migrate any brokers that only exist in the browser cache (pre-server-storage installs).
        if (parsed.data.length === 0 && cached.length > 0) {
          writeCachedBrokers(cached);
          void writeMqttBrokers(cached);
          return cached;
        }
        writeCachedBrokers(parsed.data);
        return parsed.data;
      }
    }
  } catch {
    void 0;
  }
  return readCachedBrokers();
};

export const writeMqttBrokers = async (brokers: MqttBroker[]): Promise<void> => {
  writeCachedBrokers(brokers);
  try {
    await runtimeFetch(BROKERS_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(brokers),
    });
  } catch {
    void 0;
  }
  try {
    window.dispatchEvent(new Event('openchamber:mqtt-brokers-changed'));
  } catch {
    void 0;
  }
};

export const hasMqttBrokers = (): boolean => readCachedBrokers().length > 0;
