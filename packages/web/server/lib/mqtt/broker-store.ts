import { z } from 'zod';
import type { promises as fsPromises } from 'node:fs';

export const brokerSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  username: z.string().catch(''),
  password: z.string().catch(''),
});

export type MqttBroker = z.infer<typeof brokerSchema>;

const storeSchema = z.object({
  brokers: z.array(brokerSchema).default([]),
});

export interface MqttBrokerStore {
  filePath: string;
  readBrokers: () => Promise<MqttBroker[]>;
  writeBrokers: (brokers: MqttBroker[]) => Promise<void>;
}

export interface MqttBrokerStoreDependencies {
  fsPromises: Pick<typeof fsPromises, 'mkdir' | 'readFile' | 'rename' | 'rm' | 'writeFile'>;
  path: { join: (...parts: string[]) => string; dirname: (p: string) => string };
  dataDir: string;
  logger?: Pick<Console, 'warn'>;
}

export const createMqttBrokerStore = (deps: MqttBrokerStoreDependencies): MqttBrokerStore => {
  const { fsPromises, path, dataDir, logger = console } = deps;
  const filePath = path.join(dataDir, 'mqtt-brokers.json');

  const readBrokers = async (): Promise<MqttBroker[]> => {
    let raw: string;
    try {
      raw = await fsPromises.readFile(filePath, 'utf8');
    } catch (error) {
      const code = (error as { code?: unknown })?.code;
      if (code === 'ENOENT') return [];
      throw error;
    }
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      logger.warn('[mqtt-brokers] corrupt file, returning empty list:', error);
      return [];
    }
    const parsed = storeSchema.safeParse(json);
    if (!parsed.success) {
      logger.warn('[mqtt-brokers] invalid file, returning empty list:', parsed.error);
      return [];
    }
    return parsed.data.brokers;
  };

  const writeBrokers = async (brokers: MqttBroker[]): Promise<void> => {
    const directory = path.dirname(filePath);
    await fsPromises.mkdir(directory, { recursive: true });
    const tmp = `${filePath}.tmp-${process.pid}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    try {
      await fsPromises.writeFile(tmp, JSON.stringify({ brokers }, null, 2), 'utf8');
      await fsPromises.rename(tmp, filePath);
    } catch (error) {
      await fsPromises.rm(tmp, { force: true }).catch(() => {});
      throw error;
    }
  };

  return { filePath, readBrokers, writeBrokers };
};
