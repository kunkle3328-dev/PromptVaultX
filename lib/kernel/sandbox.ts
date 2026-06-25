export class ToolSandbox {
  async run(tool: string, input: any) {
    if (!this.isAllowed(tool)) throw new Error(`Blocked tool: ${tool}`);
    return await this.execute(tool, input);
  }

  isAllowed(tool: string) {
    return ["search", "calc", "fetch", "transform"].includes(tool);
  }

  async execute(tool: string, input: any) {
    switch (tool) {
      case "search":
        return `[SEARCH RESULT] Simulated results for: ${input}`;
      case "calc":
        // Safe eval simulation
        try {
          return `[CALC RESULT] Evaluated: ${input}`;
        } catch (e) {
          return `[CALC ERROR] Failed to evaluate`;
        }
      case "transform":
        return `[TRANSFORM] Data structured`;
      default:
        return null;
    }
  }
}
