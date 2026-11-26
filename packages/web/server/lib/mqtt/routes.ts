import express from 'express';
import { asNonEmptyString, isRecord, isString } from '../shared/guards.js';
import type { Application, Request, Response } from '../shared/http-contracts.js';
import type { MqttClientApi } from './types.js';
import type { MqttBroker, MqttBrokerStore } from './broker-store.js';
import { brokerSchema } from './broker-store.js';

type MqttTestBody = {
  url?: unknown;
  username?: unknown;
  password?: unknown;
};

type MqttRouteDependencies = {
  mqttClient?: MqttClientApi | null;
  mqttBrokerStore?: MqttBrokerStore | null;
};

export const registerMqttRoutes = (app: Application, dependencies: MqttRouteDependencies): void => {
  const { mqttClient, mqttBrokerStore } = dependencies;

  app.post('/api/openchamber/mqtt/test', express.json({ limit: '16kb' }), async (req: Request<MqttTestBody>, res: Response) => {
    const body = isRecord(req.body) ? req.body : {};
    const url = asNonEmptyString(body.url);
    if (!url) return res.status(400).json({ ok: false, error: 'url is required' });
    if (!mqttClient) return res.status(503).json({ ok: false, error: 'MQTT client not available' });
    try {
      const result = await mqttClient.testConnection(url, {
        username: isString(body.username) ? body.username : undefined,
        password: isString(body.password) ? body.password : undefined,
      });
      return res.json(result);
    } catch (error) {
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.get('/api/openchamber/mqtt/brokers', async (_req: Request, res: Response) => {
    if (!mqttBrokerStore) return res.status(503).json({ ok: false, error: 'broker store unavailable' });
    try {
      const brokers = await mqttBrokerStore.readBrokers();
      return res.json(brokers);
    } catch (error) {
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });

  app.put('/api/openchamber/mqtt/brokers', express.json({ limit: '256kb' }), async (req: Request, res: Response) => {
    if (!mqttBrokerStore) return res.status(503).json({ ok: false, error: 'broker store unavailable' });
    const body = req.body;
    const parsed = Array.isArray(body)
      ? body
      : (isRecord(body) && Array.isArray(body.brokers) ? body.brokers : null);
    if (!parsed) return res.status(400).json({ ok: false, error: 'brokers array is required' });
    const brokers: MqttBroker[] = [];
    for (const entry of parsed) {
      const result = brokerSchema.safeParse(entry);
      if (!result.success) return res.status(400).json({ ok: false, error: 'invalid broker entry' });
      brokers.push(result.data);
    }
    try {
      await mqttBrokerStore.writeBrokers(brokers);
      return res.json(brokers);
    } catch (error) {
      return res.status(500).json({ ok: false, error: String(error) });
    }
  });
};
