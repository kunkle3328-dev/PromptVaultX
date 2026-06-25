export type PromptObject = {
  intent: string;
  domains: string[];
  tone: 'neutral' | 'confident' | 'authoritative';
  output: 'steps' | 'json' | 'checklist';
  constraints: string[];
  entropy: number;
};

export function mutatePrompt(
  base: PromptObject,
  context: { userLevel: string; speed: 'fast' | 'deep' }
): PromptObject {
  const roll = Math.random();

  return {
    ...base,
    tone: roll > 0.7 ? 'authoritative' : base.tone,
    output: context.speed === 'fast' ? 'steps' : base.output,
    constraints: Array.from(new Set([...base.constraints, context.userLevel]))
  };
}

export function assemblePrompt(p: PromptObject) {
  return `
Execute the following intent with precision.

Intent: ${p.intent}
Domains: ${p.domains.join(', ')}
Tone: ${p.tone}
Constraints: ${p.constraints.join(', ')}
Output format: ${p.output}

Return only the result.
`.trim();
}
