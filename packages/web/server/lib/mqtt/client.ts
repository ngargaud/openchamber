import type { IClientOptions, MqttClient } from 'mqtt';
import { normalizeBrokerUrl } from './broker-url.js';
import { topicMatches } from './topics.js';
import type {
  BrokerCredentials,
  MqttClientApi,
  MqttMessageHandler,
  MqttSubscriptionOptions,
  MqttTestResult,
} from './types.js';

let mqttModule: typeof import('mqtt') | null = null;
try {
  const loaded = await import('mqtt');
  mqttModule = loaded.default || loaded;
} catch {
  mqttModule = null;
}

type TopicSubscription = {
  qos: number;
  handlers: Set<MqttMessageHandler>;
};

type ConnectionState = {
  url: string;
  client: MqttClient;
  subscriptions: Map<string, TopicSubscription>;
  connected: boolean;
  destroyed: boolean;
};

const connections = new Map<string, ConnectionState>();
const noop = () => undefined;

const clientId = (prefix: string) => `${prefix}-${process.pid}-${Math.random().toString(16).slice(2)}`;

const connectionKey = (brokerUrl: string, credentials?: BrokerCredentials): string => (
  JSON.stringify([brokerUrl, credentials?.username ?? null, credentials?.password ?? null])
);

const withCredentials = (options: IClientOptions, credentials: BrokerCredentials | undefined): IClientOptions => {
  if (credentials?.username !== undefined) options.username = credentials.username;
  if (credentials?.password !== undefined) options.password = credentials.password;
  return options;
};

const createConnection = (brokerUrl: string, credentials: BrokerCredentials | undefined, key: string): ConnectionState | null => {
  if (!mqttModule) {
    console.warn('[mqtt] "mqtt" package is not installed; MQTT triggers are disabled.');
    return null;
  }
  const connectOptions = withCredentials({
    clientId: clientId('openchamber'),
    reconnectPeriod: 2_000,
    connectTimeout: 10_000,
    clean: true,
  }, credentials);
  const client = mqttModule.connect(brokerUrl, connectOptions);
  const state: ConnectionState = {
    url: brokerUrl,
    client,
    subscriptions: new Map(),
    connected: false,
    destroyed: false,
  };
  client.on('connect', () => {
    state.connected = true;
    console.log(`[mqtt] connected to ${brokerUrl}`);
    for (const [topic, subscription] of state.subscriptions.entries()) {
      try {
        client.subscribe(topic, { qos: subscription.qos });
        console.log(`[mqtt] subscribed to ${topic} on ${brokerUrl}`);
      } catch (error) { void error; }
    }
  });
  client.on('reconnect', () => { state.connected = false; });
  client.on('close', () => { state.connected = false; console.log(`[mqtt] disconnected from ${brokerUrl}`); });
  client.on('error', (error) => {
    console.warn('[mqtt] connection error:', String(error));
  });
  client.on('message', (topic: string, payloadBuffer: Buffer, packet: { retain?: boolean }) => {
    const payload = payloadBuffer ? payloadBuffer.toString('utf8') : '';
    const retained = Boolean(packet?.retain);
    for (const [pattern, subscription] of state.subscriptions.entries()) {
      if (!topicMatches(pattern, topic)) continue;
      for (const handler of subscription.handlers) {
        try {
          handler({ topic, payload, retained, pattern });
        } catch (error) {
          console.warn('[mqtt] handler error:', String(error));
        }
      }
    }
  });
  connections.set(key, state);
  return state;
};

const getConnection = (brokerUrl: string, credentials?: BrokerCredentials): ConnectionState | null => {
  const url = normalizeBrokerUrl(brokerUrl);
  if (!url) return null;
  const key = connectionKey(url, credentials);
  const existing = connections.get(key);
  if (existing && !existing.destroyed) return existing;
  return createConnection(url, credentials, key);
};

const subscribe = (
  brokerUrl: string,
  topic: string,
  handler: MqttMessageHandler,
  options?: MqttSubscriptionOptions,
): () => void => {
  const state = getConnection(brokerUrl, options);
  if (!state) return noop;
  let subscription = state.subscriptions.get(topic);
  if (!subscription) {
    subscription = { qos: options?.qos ?? 0, handlers: new Set() };
    state.subscriptions.set(topic, subscription);
    if (state.connected) {
      try {
        state.client.subscribe(topic, { qos: subscription.qos });
      } catch (error) { void error; }
    }
  }
  subscription.handlers.add(handler);
  return () => {
    const active = state.subscriptions.get(topic);
    if (!active) return;
    active.handlers.delete(handler);
    if (active.handlers.size === 0) {
      state.subscriptions.delete(topic);
      try {
        state.client.unsubscribe(topic);
      } catch (error) { void error; }
    }
  };
};

const testConnection = (brokerUrl: string, credentials?: BrokerCredentials): Promise<MqttTestResult> => new Promise((resolve) => {
  const url = normalizeBrokerUrl(brokerUrl);
  if (!url) {
    resolve({ ok: false, error: 'Invalid broker URL' });
    return;
  }
  if (!mqttModule) {
    resolve({ ok: false, error: 'MQTT module not available' });
    return;
  }
  let settled = false;
  const connectOptions = withCredentials({
    clientId: clientId('openchamber-test'),
    reconnectPeriod: 0,
    connectTimeout: 8_000,
    clean: true,
  }, credentials);
  const client = mqttModule.connect(url, connectOptions);
  const finish = (result: MqttTestResult) => {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    try {
      client.end(true);
    } catch (error) { void error; }
    resolve(result);
  };
  const timer = setTimeout(() => finish({ ok: false, error: 'Connection timed out' }), 9_000);
  client.on('connect', () => { finish({ ok: true }); });
  client.on('error', (error) => { finish({ ok: false, error: String(error) }); });
  client.on('close', () => { finish({ ok: false, error: 'Connection closed' }); });
});

export const isAvailable = (): boolean => Boolean(mqttModule);

export const mqttClient: MqttClientApi = { isAvailable, subscribe, testConnection };
