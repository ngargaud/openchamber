export type BrokerCredentials = {
  username?: string | undefined;
  password?: string | undefined;
};

export type MqttQos = 0 | 1 | 2;

export type MqttSubscriptionOptions = BrokerCredentials & {
  qos?: MqttQos | undefined;
};

export type MqttMessageEvent = {
  topic: string;
  payload: string;
  retained: boolean;
  pattern: string;
};

export type MqttMessageHandler = (event: MqttMessageEvent) => void;

export type MqttTestResult = {
  ok: boolean;
  error?: string | undefined;
};

export type MqttClientApi = {
  isAvailable: () => boolean;
  subscribe: (
    brokerUrl: string,
    topic: string,
    handler: MqttMessageHandler,
    options?: MqttSubscriptionOptions,
  ) => () => void;
  testConnection: (brokerUrl: string, options?: BrokerCredentials) => Promise<MqttTestResult>;
};

export type MqttTaskConfig = {
  topic: string;
  qos?: MqttQos | undefined;
  broker?: string | undefined;
  username?: string | undefined;
  password?: string | undefined;
  payloadTemplate?: string | undefined;
  topicTemplate?: string | undefined;
  handleRetained?: boolean | undefined;
  minIntervalMs?: number | undefined;
  dedup?: boolean | undefined;
};

export type MqttTask = {
  id: string;
  name?: string | undefined;
  mqtt?: MqttTaskConfig | undefined;
};

export type MqttTaskEntry = {
  projectID: string;
  task: MqttTask;
};

export type MqttTriggerReason = 'mqtt';

export type MqttTriggerResult = {
  ok: boolean;
};

export type MqttTasksRuntime = {
  listMqttTasks: () => readonly MqttTaskEntry[];
  triggerTask: (
    projectID: string,
    taskID: string,
    reason: MqttTriggerReason,
    payload: string,
    topic: string,
  ) => Promise<MqttTriggerResult>;
};

export type MqttLogger = Pick<Console, 'log' | 'warn'>;
