import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { kernel } from "@/lib/kernel";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: NextRequest) {
  try {
    const { prompt, tier } = await req.json();
    
    // Use the Router Brain to classify and plan
    const plan = await kernel.router.route(prompt);
    console.log("Kernel execution plan:", plan);
    
    if (tier === 'free' || !apiKey) {
      const fallbackText = tier === 'free' 
        ? `[LOCAL MODE - FREE TIER]\nIntent: ${plan.action}\n\n` + prompt.slice(0, 400) + "\n\n(Cloud routing disabled for free tier)"
        : `[LOCAL MODE - OFFLINE/NO_KEYS]\nIntent: ${plan.action}\n\n` + prompt.slice(0, 400) + "\n\n(Fallback simulation triggered)";
      
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(fallbackText));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain" } });
    }

    // Execute plan based on action
    if (plan.action === "execute_tool") {
      const result = await kernel.sandbox.run("search", prompt);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`[TOOL SANDBOX]\n${result}`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain" } });
    } else if (plan.action === "query_memory") {
      const stats = kernel.memory.getStats();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`[MEMORY GRAPH]\nActive Nodes: ${stats.nodes}\nHealth: ${stats.health}\nQuery successful.`));
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain" } });
    } else if (plan.action === "spawn_agent") {
      const results = await kernel.swarm.run(prompt);
      const stream = new ReadableStream({
        async start(controller) {
          for (const res of results) {
            controller.enqueue(new TextEncoder().encode(`${res}\n\n`));
            await new Promise(r => setTimeout(r, 800)); // Simulate agent thinking time
          }
          controller.close();
        }
      });
      return new Response(stream, { headers: { "Content-Type": "text/plain" } });
    }

    // Multi-Model Fallback execution (Simulated for this environment)
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const ai = new GoogleGenAI({ apiKey });
          
          let responseStream;
          try {
            // Priority 1: primary-model (gemini)
            responseStream = await ai.models.generateContentStream({
              model: "gemini-3.5-flash",
              contents: prompt,
            });
          } catch (e) {
            console.warn("Primary model failed, failing over to secondary...");
            controller.enqueue(new TextEncoder().encode("[Primary Model Failed - Failing over to Secondary]\n\n"));
            try {
              // Priority 2: secondary-model (fallback simulation)
              responseStream = await ai.models.generateContentStream({
                model: "gemini-2.5-flash", 
                contents: prompt,
              });
            } catch (e2) {
               console.warn("Secondary model failed, using local cached fallback...");
               controller.enqueue(new TextEncoder().encode("[Secondary Model Failed - Using Local Cache]\n\n"));
               controller.enqueue(new TextEncoder().encode("All cloud models offline. Local fallback engaged.\n\nSimulated cached response."));
               controller.close();
               return;
            }
          }

          for await (const chunk of responseStream) {
            controller.enqueue(new TextEncoder().encode(chunk.text));
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      }
    });

    return new Response(stream, { headers: { "Content-Type": "text/plain" } });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

