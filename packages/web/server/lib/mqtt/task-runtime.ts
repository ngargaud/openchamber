import { renderMqttPromptText } from './prompt.js';
import type { JsonValue } from '../shared/json-values.js';
import type { ScheduledTask } from '../projects/contracts.js';

type TaskReason = 'manual' | 'scheduled' | 'mqtt';

type TaskRunResult = {
  ok: boolean;
};

type MqttTaskRuntimeDependencies = {
  tasksByProject: ReadonlyMap<string, ReadonlyMap<string, ScheduledTask>>;
  runningTaskKeys: ReadonlySet<string>;
  queuedTaskKeys: ReadonlySet<string>;
  buildTaskKey: (projectID: string, taskID: string) => string;
  runTask: (
    projectID: string,
    taskID: string,
    reason: TaskReason,
    scheduledFor: number | undefined,
    payload: JsonValue,
    topic: string,
  ) => Promise<TaskRunResult>;
};

type MqttTaskEntry = {
  projectID: string;
  task: ScheduledTask;
};

export const createMqttTaskRuntime = (deps: MqttTaskRuntimeDependencies) => {
  const renderEffectiveTask = (
    task: ScheduledTask,
    reason: TaskReason,
    payload: JsonValue | undefined,
    topic: string | undefined,
  ): ScheduledTask => {
    if (reason !== 'mqtt' || payload === undefined) return task;
    const prompt = renderMqttPromptText(task.execution.prompt, payload, topic ?? '', task.mqtt);
    return { ...task, execution: { ...task.execution, prompt } };
  };

  const triggerTask = async (
    projectID: string,
    taskID: string,
    reason: TaskReason = 'mqtt',
    payload: JsonValue = '',
    topic = '',
  ): Promise<TaskRunResult> => {
    const taskKey = deps.buildTaskKey(projectID, taskID);
    if (deps.runningTaskKeys.has(taskKey)) return { ok: false };
    if (deps.queuedTaskKeys.has(taskKey)) return { ok: false };
    return deps.runTask(projectID, taskID, reason, undefined, payload, topic);
  };

  const listMqttTasks = (): MqttTaskEntry[] => {
    const result: MqttTaskEntry[] = [];
    for (const [projectID, taskMap] of deps.tasksByProject.entries()) {
      for (const task of taskMap.values()) {
        if (task.mqtt) result.push({ projectID, task });
      }
    }
    return result;
  };

  return { renderEffectiveTask, triggerTask, listMqttTasks };
};
