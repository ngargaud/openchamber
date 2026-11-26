# MQTT triggers module

Server-owned MQTT trigger runtime for OpenChamber. An event task carries an
`mqtt` field and reuses the scheduled-tasks execution path through
`runtime.triggerTask(projectID, taskID, 'mqtt', payload, topic)`.

## Ownership

This module owns broker connections, topic subscriptions, trigger deduplication,
template rendering for MQTT prompts, and the broker test-connection route.
Scheduled-task persistence stays in `projects/project-config`, and execution
stays in `scheduled-tasks/runtime`. The UI owns its broker list in browser
localStorage and copies the selected broker URL and credentials into the task.

## Task shape

A task may carry an `mqtt` field instead of a `schedule`:

- `topic` (required): MQTT topic, may include `+` / `#` wildcards.
- `qos`: 0/1/2 (default 0).
- `broker`: broker URL, using `mqtt://`, `mqtts://`, `ws://` or `wss://` (default `mqtt://localhost:1883`). Use `wss://` for a TLS WebSocket endpoint, for example `wss://mqtt.example.com:443/mqtt`.
- `username` / `password`: optional auth copied from the saved broker.
- `payloadTemplate`: prompt template with `{{payload}}`, `{{topic}}`, `{{payload.key}}` or nested paths.
- `topicTemplate`: template for the topic value shown to the prompt.
- `handleRetained`: whether to fire on retained messages (default false).
- `minIntervalMs`: debounce between fires.
- `dedup`: deduplicate identical payloads within 60s (default true).

## Invariants

- Event tasks subscribe when they are created or saved, after a server restart,
  and on the reconcile tick that follows a runtime refresh.
- Retained messages are ignored by default, including the burst delivered when
  a subscription is restored.
- A task stores one trigger. Converting a task to an event clears its schedule,
  and converting it back clears its MQTT config.
- Subscriptions are grouped by broker, topic, and credentials. Tasks using the
  same topic under different identities subscribe separately, and the highest
  configured QoS wins for a group.
- Broker URL normalization preserves `ws://` and `wss://`. MQTT.js selects the
  WebSocket transport from the scheme, so no protocol change is needed.
- A WebSocket broker URL includes its path when the broker uses one, for example
  `wss://mqtt.example.com:8084/mqtt`. Without a path MQTT.js connects to `/`.
- Remote brokers behind a TLS reverse proxy use `wss://` with the proxy's
  WebSocket path. `mqtt://` needs a directly reachable TCP port, which a
  containerized instance may not have.
- A broker URL without a scheme gets `mqtt://` added.
- Trigger deduplication is in memory and per process. Tasks and their stored
  credentials survive a container rebuild through the `openchamber_projects`
  volume mounted at the config projects directory.

## Decisions

### Why the scheduler owns execution

The MQTT manager decides whether a message should fire and renders the prompt.
The scheduled-tasks runtime owns session creation, targeting, worktrees, and
run status, so an event run has the same execution contract as a scheduled run.

### Why WebSocket URLs keep their path

Normalizing a `ws://` or `wss://` URL to a TCP URL would drop the path a
WebSocket reverse proxy needs. Passing the URL through to MQTT.js keeps the
host, port, and path the user configured in Settings.

### Why remote brokers use wss://

A `wss://` URL connects through a TLS reverse proxy that exposes the MQTT
WebSocket endpoint on its configured path. `mqtt://` needs a separate TCP
listener that a hosted or containerized deployment may not expose. The deployed
instance connects to `wss://mqtt.start2make.it:443` this way.

### Why deduplication stays in memory

A shared broker can deliver a message to more than one OpenChamber process. A
persistent claim like the scheduled occurrence lock would be needed to make
deduplication cross-instance. That needs a product decision about which
instance owns an event, so this version keeps the claim local to a process.
