import { memoryGraph } from './memory';

export class BackgroundAgent {
  private isRunning = false;

  async start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.runLoop();
  }

  stop() {
    this.isRunning = false;
  }

  private async runLoop() {
    while (this.isRunning) {
      const task = await this.getTask();
      if (task) {
        const result = await this.execute(task);
        memoryGraph.addMemory({
          id: `mem-${Date.now()}`,
          content: `Agent Action: ${result}`,
          embedding: [Math.random(), Math.random(), Math.random()],
          tags: ['agent', 'background'],
          weight: 0.8,
          timestamp: Date.now()
        });
      }
      await new Promise(r => setTimeout(r, 10000)); // Sleep 10s
    }
  }

  private async getTask() {
    // Simulate picking up a background task occasionally
    if (Math.random() > 0.7) {
      return { id: `task-${Date.now()}`, type: "optimization" };
    }
    return null;
  }

  private async execute(task: any) {
    return `Completed ${task.type} task [${task.id}]`;
  }
}

export const bgAgent = new BackgroundAgent();
