export type Plugin = {
  id: string;
  name: string;
  version: string;
  execute: (input: any) => Promise<any>;
};

export class PluginRegistry {
  plugins = new Map<string, Plugin>();

  register(plugin: Plugin) {
    this.plugins.set(plugin.id, plugin);
  }

  async run(id: string, input: any) {
    const plugin = this.plugins.get(id);
    if (!plugin) throw new Error(`Plugin ${id} not found`);
    return plugin.execute(input);
  }
  
  list() {
    return Array.from(this.plugins.values()).map(p => ({ id: p.id, name: p.name, version: p.version }));
  }
}

export const pluginRegistry = new PluginRegistry();

// Register some default simulated plugins
pluginRegistry.register({
  id: "prompt-enhancer",
  name: "Prompt DNA Optimizer",
  version: "1.0.0",
  execute: async (input) => `[OPTIMIZED] ${input}`
});
