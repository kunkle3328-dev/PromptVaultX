import { RouterBrain } from './router';
import { ToolSandbox } from './sandbox';
import { MemoryGraph, memoryGraph } from './memory';
import { PluginRegistry, pluginRegistry } from './plugins';
import { BackgroundAgent, bgAgent } from './agent';
import { AgentSwarm, agentSwarm } from './swarm';

export const kernel = {
  router: new RouterBrain(),
  sandbox: new ToolSandbox(),
  memory: memoryGraph,
  plugins: pluginRegistry,
  agent: bgAgent,
  swarm: agentSwarm,
};

// Start background agent automatically
kernel.agent.start();

