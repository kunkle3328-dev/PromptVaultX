export interface Agent {
  name: string;
  execute(input: any): Promise<any>;
}

export class PlannerAgent implements Agent {
  name = "Planner";
  async execute(input: any) {
    return `[PLANNER] Decomposed task: ${input}`;
  }
}

export class ResearchAgent implements Agent {
  name = "Researcher";
  async execute(input: any) {
    return `[RESEARCH] Gathered context for plan.`;
  }
}

export class CodeAgent implements Agent {
  name = "Coder";
  async execute(input: any) {
    return `[CODER] Generated solution based on research.`;
  }
}

export class CriticAgent implements Agent {
  name = "Critic";
  async execute(input: any) {
    return `[CRITIC] Validated execution. No critical errors found.`;
  }
}

export class OptimizerAgent implements Agent {
  name = "Optimizer";
  async execute(input: any) {
    return `[OPTIMIZER] Final polish applied. Output ready.`;
  }
}

export class AgentSwarm {
  agents: Agent[] = [
    new PlannerAgent(),
    new ResearchAgent(),
    new CodeAgent(),
    new CriticAgent(),
    new OptimizerAgent()
  ];

  async run(task: string) {
    let currentData = task;
    const stream = [];
    for (const agent of this.agents) {
      currentData = await agent.execute(currentData);
      stream.push(currentData);
    }
    return stream;
  }
}

export const agentSwarm = new AgentSwarm();
