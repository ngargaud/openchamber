import { z } from 'zod';

const MQTT_BROKERS_STORAGE_KEY = 'openchamber.mqtt.brokers';

const brokerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  username: z.string().catch(''),
  password: z.string().catch(''),
});

const brokerListSchema = z.array(brokerSchema);

export type MqttBroker = z.infer<typeof brokerSchema>;

export const readMqttBrokers = (): MqttBroker[] => {
  try {
    const raw = localStorage.getItem(MQTT_BROKERS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = brokerListSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : [];
  } catch (error) {
    void error;
    return [];
  }
};

export const hasMqttBrokers = (): boolean => readMqttBrokers().length > 0;

export const writeMqttBrokers = (brokers: MqttBroker[]): void => {
  try {
    localStorage.setItem(MQTT_BROKERS_STORAGE_KEY, JSON.stringify(brokers));
  } catch (error) {
    void error;
  }
  try {
    window.dispatchEvent(new Event('openchamber:mqtt-brokers-changed'));
  } catch (error) {
    void error;
  }
};
