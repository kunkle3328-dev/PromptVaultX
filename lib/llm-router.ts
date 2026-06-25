export interface Provider {
  name: string;
  healthy: boolean;
  execute(prompt: string): Promise<string>;
}

export class LLMRouter {
  constructor(private providers: Provider[]) {}

  async run(prompt: string): Promise<string> {
    for (const provider of this.providers) {
      if (!provider.healthy) continue;
      try {
        return await provider.execute(prompt);
      } catch (err) {
        console.error(`Provider ${provider.name} failed:`, err);
        provider.healthy = false;
      }
    }
    return this.fallback(prompt);
  }

  private fallback(prompt: string) {
    return `[LOCAL MODE RESPONSE - OFFLINE/NO_KEYS]\n${prompt.slice(0, 400)}\n\n(Fallback simulation triggered)`;
  }
}
