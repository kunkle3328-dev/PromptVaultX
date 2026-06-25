"use client";
import { SystemProvider, useSystemStore } from "@/lib/store";
import { GalaxyCanvas } from "@/components/GalaxyCanvas";
import { motion, AnimatePresence } from "motion/react";
import { Shield, Brain, Scale, Gavel, Handshake, Zap, Box, Terminal, Settings, Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { mutatePrompt, assemblePrompt, PromptObject } from "@/lib/engine";

const springTransition = { type: "spring" as const, stiffness: 160, damping: 18, mass: 1 };

export default function App() {
  return (
    <SystemProvider>
      <MainLayout />
    </SystemProvider>
  );
}

function MainLayout() {
  const { osMode, setOsMode } = useSystemStore();

  return (
    <main className="relative flex flex-col min-h-[100dvh] bg-[#050505] text-[#e0e0e0] font-sans selection:bg-[#00f6ff]/30 overflow-hidden">
      <GalaxyCanvas />
      
      <AnimatePresence>
        {!osMode ? (
          <motion.div 
            key="standard-ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="flex-1 flex flex-col z-10"
          >
            {/* Top Header */}
            <header className="relative flex items-center justify-between px-6 sm:px-10 py-8 border-b border-[#ffffff10] bg-[#ffffff02] backdrop-blur-md w-full">
              <div className="flex items-baseline space-x-4">
                <h1 className="text-xl sm:text-2xl font-bold tracking-[0.3em] text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">PROMPTVAULT X</h1>
                <span className="hidden sm:inline-block text-[10px] font-mono text-[#00f6ff] px-2 py-0.5 border border-[#00f6ff40] rounded shadow-[0_0_10px_rgba(0,246,255,0.2)]">V1.0.4-SHIP</span>
              </div>
              <div className="flex items-center space-x-4 sm:space-x-8">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[9px] uppercase tracking-widest text-[#888]">Neural Stability</span>
                  <span className="text-xs font-mono text-[#00ff88] drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]">STABLE / 99.8%</span>
                </div>
                <div className="hidden sm:block w-px h-8 bg-[#ffffff15]"></div>
                
                <button 
                  onClick={() => setOsMode(true)}
                  className="w-10 h-10 rounded-full border border-[#ffffff20] bg-[#ffffff05] flex items-center justify-center hover:bg-[#ffffff10] transition-colors"
                  title="Activate Voice & OS Mode"
                >
                  <Mic size={16} className="text-[#00f6ff]" />
                </button>

                <div className="flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-[#00ff88] shadow-[0_0_8px_#00ff88] animate-pulse" />
                  <span className="text-[10px] font-mono uppercase text-white tracking-widest hidden sm:block">Router: Online</span>
                </div>
              </div>
            </header>

            <div className="relative flex-1 w-full max-w-4xl mx-auto flex flex-col p-6 sm:p-10 pb-32">
              <WorkspaceRouter />
            </div>

            <CommandDock />
          </motion.div>
        ) : (
          <AiOsShell key="ai-os" />
        )}
      </AnimatePresence>
    </main>
  );
}

function AiOsShell() {
  const { setOsMode, executionState, setExecutionState } = useSystemStore();
  const [command, setCommand] = useState("");
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState<string[]>(["> AI OS Shell initialized.", "> Ready for commands."]);
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setLogs(l => [...l, "> ERROR: Voice module unavailable in this environment."]);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setCommand(transcript);
    };
    recognition.start();
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    if (command.toLowerCase() === 'exit') {
      setOsMode(false);
      return;
    }

    setLogs(l => [...l, `> ${command}`, "> Processing..."]);
    setExecutionState('executing');
    setCommand("");
    setOutput("");

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: command, tier: 'pro' })
      });
      
      if (!res.ok) throw new Error("Failed");

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let done = false;
      let streamed = "";

      while (!done) {
        const { value, done: d } = await reader.read();
        done = d;
        if (value) {
          streamed += decoder.decode(value, { stream: true });
          setOutput(streamed);
        }
      }
      setLogs(l => [...l, "> Output stream complete."]);
      setExecutionState('idle');
    } catch (e) {
      setLogs(l => [...l, "> ERROR: Connection failed."]);
      setExecutionState('error');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="absolute inset-0 z-50 flex flex-col p-6 sm:p-10"
    >
      <div className="flex justify-between items-center mb-8">
        <div className="text-[#00f6ff] font-mono text-xs tracking-widest uppercase animate-pulse">
          Global Execution Layer
        </div>
        <button onClick={() => setOsMode(false)} className="text-[#555] hover:text-white font-mono text-xs uppercase tracking-widest transition-colors">
          [ EXIT OS ]
        </button>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden gap-6">
        <GlassCard className="flex-1 p-6 overflow-y-auto flex flex-col gap-4">
          <div className="space-y-2">
            {logs.map((log, i) => (
              <div key={i} className={`font-mono text-xs sm:text-sm ${log.includes('ERROR') ? 'text-[#ff0033]' : 'text-[#888]'}`}>
                {log}
              </div>
            ))}
          </div>
          {output && (
            <div className="font-mono text-sm sm:text-base text-[#e0e0e0] whitespace-pre-wrap leading-relaxed mt-4">
              {output}
            </div>
          )}
        </GlassCard>

        <form onSubmit={handleCommand} className="relative">
          <GlassCard className="p-4 flex items-center gap-4 border border-[#ffffff20]">
            <span className="text-[#00f6ff] font-mono animate-pulse">_</span>
            <input
              type="text"
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              placeholder="Enter system command or neural intent..."
              className="bg-transparent border-none outline-none text-white w-full font-mono text-sm placeholder-[#444]"
              autoFocus
            />
            {executionState === 'executing' ? (
              <div className="w-5 h-5 rounded-full border-2 border-[#00f6ff] border-t-transparent animate-spin" />
            ) : (
              <button 
                type="button"
                onClick={startListening} 
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isListening ? 'bg-[#ff0033] animate-pulse' : 'bg-[#ffffff10] hover:bg-[#ffffff20]'}`}
              >
                <Mic size={14} className={isListening ? 'text-white' : 'text-[#00f6ff]'} />
              </button>
            )}
          </GlassCard>
        </form>
      </div>
    </motion.div>
  );
}

function WorkspaceRouter() {
  const { activeView } = useSystemStore();
  
  return (
    <AnimatePresence mode="wait">
      {activeView === 'modes' && <motion.div key="modes" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={springTransition} className="flex-1 flex flex-col"><ModesView /></motion.div>}
      {activeView === 'vault' && <motion.div key="vault" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={springTransition} className="flex-1 flex flex-col"><VaultView /></motion.div>}
      {activeView === 'settings' && <motion.div key="settings" initial={{opacity: 0, y: 20}} animate={{opacity: 1, y: 0}} exit={{opacity: 0, y: -20}} transition={springTransition} className="flex-1 flex flex-col"><SettingsView /></motion.div>}
    </AnimatePresence>
  );
}

function GlassCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  return (
    <div className={`relative rounded-xl overflow-hidden border border-[#ffffff15] bg-[#ffffff05] backdrop-blur-xl shadow-2xl ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#ffffff10] to-[#00f6ff05] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }} />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

function ModesView() {
  const { mode, tier, setExecutionState, executionState } = useSystemStore();
  const [intent, setIntent] = useState("");
  const [output, setOutput] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const handleExecute = async () => {
    if (!mode || mode === 'idle' || !intent) return;
    
    setExecutionState('thinking');
    setOutput("");
    setLogs(["Parsing context...", "Mutating prompt structure..."]);
    
    const basePrompt: PromptObject = {
      intent,
      domains: [mode],
      tone: 'neutral',
      output: 'json',
      constraints: ['No filler'],
      entropy: 0.5
    };

    const mutated = mutatePrompt(basePrompt, { userLevel: tier, speed: 'fast' });
    const finalPrompt = assemblePrompt(mutated);

    setTimeout(() => {
      setLogs(l => [...l, `Routing via [${tier === 'free' ? 'LOCAL' : 'CLOUD'}] mode...`, "Generating intent synthesis..."]);
      setExecutionState('executing');
    }, 1500);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, tier })
      });
      
      if (!res.ok) {
        throw new Error("Failed to execute");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No readable stream available");

      const decoder = new TextDecoder();
      let done = false;
      let streamedOutput = "";

      setExecutionState('executing');
      
      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        if (value) {
          streamedOutput += decoder.decode(value, { stream: true });
          setOutput(streamedOutput);
        }
      }

      setLogs(l => [...l, "[SUCCESS] Local verification pass.", "[OK] Intent output complete."]);
      setExecutionState('idle');
    } catch (e) {
      setOutput("Error executing protocol.");
      setLogs(l => [...l, "[FAIL] Node exception. Retrying...", "[ERROR] Router collapse."]);
      setExecutionState('error');
    }
  };

  return (
    <div className="flex-1 flex flex-col gap-10 pb-32">
      <section>
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-4">Execution Engines</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <ModeButton id="Persuasion Engine" icon={Brain} subtitle="Psychological framing" />
          <ModeButton id="Legal Rewrite" icon={Scale} subtitle="Syntactic precision" />
          <ModeButton id="Authority Builder" icon={Gavel} subtitle="Status signaling" />
          <ModeButton id="Negotiation Stack" icon={Handshake} subtitle="Consensus modeling" />
        </div>
      </section>

      <AnimatePresence>
        {mode !== "idle" && (
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={springTransition}
            className="flex-1 flex flex-col mt-4"
          >
            <div className="flex items-center space-x-3 text-[10px] font-mono mb-2 text-[#444]">
              <span className="text-[#00f6ff] drop-shadow-[0_0_5px_rgba(0,246,255,0.5)]">READY</span>
              <span>CONTEXT: DEEP</span>
              <span>MUTATION: ON</span>
              <span>ROUTER: {tier === 'free' ? 'LOCAL' : 'CLOUD'}</span>
            </div>
            
            <GlassCard className="p-4 flex items-start space-x-4 focus-within:border-[#00f6ff40] transition-colors duration-500">
              <span className="text-[#00f6ff] font-mono mt-0.5">$</span>
              <textarea
                value={intent}
                onChange={(e) => setIntent(e.target.value)}
                placeholder={`Enter neural intent for ${mode}...`}
                className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-[#444] resize-none min-h-[100px]"
              />
            </GlassCard>
            
            <div className="mt-16 flex justify-center">
               <AICoreOrb onClick={handleExecute} disabled={!intent} />
            </div>

            <AnimatePresence>
              {(executionState === 'thinking' || executionState === 'executing' || output) && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  transition={springTransition}
                  className="mt-16"
                >
                  <GlassCard className="p-6">
                    <div className="flex justify-between items-end mb-4">
                      <div className="text-[#555] text-[9px] font-mono">// MUTATION_LOG_STREAM</div>
                      {executionState !== 'idle' && executionState !== 'error' && (
                        <div className="w-32 h-1 bg-[#1a1a1a] rounded-full overflow-hidden">
                          <motion.div 
                            className="h-full bg-[#00f6ff]" 
                            initial={{ width: "0%" }} 
                            animate={{ width: executionState === 'executing' ? "80%" : "30%" }} 
                            transition={{ duration: 1 }}
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-1 mb-6">
                      {logs.map((log, i) => (
                        <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className={`text-[10px] font-mono ${log.includes('[FAIL]') || log.includes('[ERROR]') ? 'text-[#ff0033]' : log.includes('[SUCCESS]') || log.includes('[OK]') ? 'text-[#00ff88]' : 'text-[#888]'}`}>
                          → {log}
                        </motion.div>
                      ))}
                    </div>

                    {output && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                        <h3 className="text-xs font-mono text-[#00ff88] mb-2">[SUCCESS] Intent Executed</h3>
                        <p className="text-sm font-mono text-[#e0e0e0] whitespace-pre-wrap break-words leading-relaxed">{output}</p>
                      </motion.div>
                    )}
                  </GlassCard>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function VaultView() {
  const genes = [
    { id: "gene-001", name: "Persuasion Core Alpha", score: 98.4, mutations: 3 },
    { id: "gene-002", name: "Negotiation Stack Beta", score: 85.2, mutations: 1 },
    { id: "gene-003", name: "Legal Rewrite Delta", score: 92.1, mutations: 5 },
  ];

  return (
    <div className="flex-1 flex flex-col gap-6">
      <div className="flex justify-between items-end mb-4">
        <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#888]">Prompt Genome Vault</h2>
        <span className="text-[10px] font-mono text-[#00ff88]">System: Evolving</span>
      </div>

      {genes.map((gene) => (
        <GlassCard key={gene.id} className="p-5 hover:border-[#00f6ff40] transition-colors group cursor-pointer">
          <div className="flex justify-between items-start mb-3">
            <div>
              <div className="text-xs font-mono text-[#00f6ff] mb-1">{gene.id}</div>
              <div className="text-sm font-bold text-white group-hover:text-[#00f6ff] transition-colors">{gene.name}</div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-[#888] uppercase tracking-widest mb-1">Performance</span>
              <span className={`text-sm font-mono ${gene.score > 90 ? 'text-[#00ff88] drop-shadow-[0_0_5px_rgba(0,255,136,0.5)]' : 'text-white'}`}>{gene.score}%</span>
            </div>
          </div>
          <div className="w-full bg-[#111] h-1.5 rounded-full overflow-hidden mb-3">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${gene.score}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-full ${gene.score > 90 ? 'bg-[#00ff88]' : 'bg-[#00f6ff]'}`}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#555]">
            <span>Mutations: {gene.mutations}</span>
            <span>Status: {gene.score > 90 ? 'Optimized' : 'Learning'}</span>
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function SettingsView() {
  const { tier, setTier } = useSystemStore();
  
  return (
    <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
      <h2 className="text-[10px] uppercase tracking-[0.2em] text-[#888] mb-6">Tier Configuration</h2>
      
      <div className="space-y-4">
        <TierButton id="free" title="Free" subtitle="Local-only engine. No mutation routing." isActive={tier === 'free'} onClick={() => setTier('free')} />
        <TierButton id="pro" title="Pro / $19" subtitle="Full cloud routing + mutation engine." isActive={tier === 'pro'} onClick={() => setTier('pro')} />
        <TierButton id="black" title="Black / $49" subtitle="Custom prompt DNA + elite modes." isActive={tier === 'black'} onClick={() => setTier('black')} />
      </div>
    </div>
  );
}

function TierButton({ id, title, subtitle, isActive, onClick }: { id: string, title: string, subtitle: string, isActive: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left"
    >
      <GlassCard className={`p-6 transition-colors duration-500 ${isActive ? 'border-[#00f6ff60]' : 'border-[#ffffff10] hover:bg-[#ffffff08]'}`}>
        <div className={`text-sm font-bold tracking-widest uppercase ${isActive ? 'text-[#00f6ff] drop-shadow-[0_0_5px_rgba(0,246,255,0.5)]' : 'text-white'}`}>{title}</div>
        <div className="text-[10px] text-[#888] mt-2">{subtitle}</div>
      </GlassCard>
    </button>
  );
}

function ModeButton({ id, icon: Icon, subtitle }: { id: any, icon: any, subtitle?: string }) {
  const { mode, setMode } = useSystemStore();
  const isActive = mode === id;

  return (
    <button
      onClick={() => setMode(id)}
      className="relative text-left group overflow-hidden"
    >
      <GlassCard className={`p-4 transition-colors duration-500 ${isActive ? 'border-[#00f6ff50] bg-[#00f6ff0a]' : 'border-transparent hover:bg-[#ffffff08]'}`}>
        <div className="flex items-center gap-3 mb-1">
          <Icon size={16} className={`transition-colors duration-300 ${isActive ? 'text-[#00f6ff]' : 'text-[#888] group-hover:text-[#aaa]'}`} />
          <span className={`text-xs font-semibold ${isActive ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]' : 'text-[#888]'}`}>{id}</span>
        </div>
        {subtitle && <div className={`text-[9px] mt-1 transition-colors duration-300 ${isActive ? 'text-[#00f6ff]/70 italic' : 'text-[#555]'}`}>{subtitle}</div>}
      </GlassCard>
    </button>
  );
}

function AICoreOrb({ onClick, disabled }: { onClick: () => void, disabled: boolean }) {
  const { executionState } = useSystemStore();
  
  const isError = executionState === 'error';
  const isWorking = executionState === 'thinking' || executionState === 'executing';
  
  const baseColorHex = isError ? '#ff0033' : '#00f6ff';
  const baseColorRgba = isError ? 'rgba(255,0,51' : 'rgba(0,246,255';

  return (
    <div className="flex flex-col items-center gap-6 relative">
      <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex items-center justify-center">
        <motion.div 
          animate={{ scale: isWorking ? [1.1, 1.2, 1.1] : 1.1, opacity: isWorking ? 0.8 : 0.4 }} 
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute w-full h-full rounded-full border pointer-events-none" style={{ borderColor: `${baseColorHex}20` }} 
        />
        <motion.div 
          animate={{ scale: isWorking ? [1.3, 1.4, 1.3] : 1.3, opacity: isWorking ? 0.6 : 0.2 }} 
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute w-full h-full rounded-full border pointer-events-none" style={{ borderColor: `${baseColorHex}10` }} 
        />
        
        <motion.button
          onClick={onClick}
          disabled={disabled || isWorking}
          whileHover={!disabled ? { scale: 1.05 } : {}}
          whileTap={!disabled ? { scale: 0.95 } : {}}
          transition={springTransition}
          className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full bg-gradient-to-tr from-[#000] via-[#0a0a0a] to-[#1a1a1a] flex items-center justify-center border border-[#ffffff10] group disabled:opacity-50 disabled:cursor-not-allowed z-20"
          style={{ boxShadow: `0 0 ${isWorking ? '80px' : '40px'} ${baseColorRgba},0.15)` }}
        >
          <motion.div 
            className="w-24 h-24 rounded-full absolute blur-xl"
            style={{ backgroundColor: baseColorHex }}
            animate={{ 
              opacity: disabled ? 0.05 : isWorking ? [0.2, 0.4, 0.2] : [0.05, 0.15, 0.05],
              scale: isWorking ? [1, 1.5, 1] : 1
            }}
            transition={{ duration: isWorking ? 1 : 3, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="text-center z-30 flex flex-col items-center">
             <div className="text-[10px] tracking-[0.5em] uppercase mb-1 font-bold" style={{ color: disabled ? '#444' : baseColorHex }}>
               {isWorking ? 'Processing' : isError ? 'Collapse' : 'Awaiting Intent'}
             </div>
             <div className={`text-3xl sm:text-4xl font-thin italic ${disabled ? 'text-[#666]' : 'text-white'}`}>Execute</div>
          </div>
        </motion.button>
      </div>

      <div className="flex flex-col items-center gap-1 mt-4">
        <span className="text-[10px] font-mono text-[#555] uppercase tracking-widest">• Tap to Execute</span>
        <span className="text-[10px] font-mono text-[#444] uppercase tracking-widest">• Long press for Advanced</span>
      </div>
    </div>
  );
}

function CommandDock() {
  const { activeView, setActiveView, executionState } = useSystemStore();
  const isWorking = executionState === 'thinking' || executionState === 'executing';

  return (
    <footer className="relative z-20 h-24 border-t border-[#ffffff10] bg-[#000000a0] backdrop-blur-xl flex items-center justify-center px-4 sm:px-10 mt-auto">
      <div className="flex items-center space-x-6 sm:space-x-12 relative">
        <DockItem label="Vault" icon={Box} active={activeView === 'vault'} onClick={() => setActiveView('vault')} />
        <DockItem label="Modes" icon={Brain} active={activeView === 'modes'} onClick={() => setActiveView('modes')} />
        
        <motion.button 
          onClick={() => setActiveView('modes')}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          transition={springTransition}
          className="relative w-14 h-14 sm:w-16 sm:h-16 bg-[#0a0a0a] rounded-full flex items-center justify-center -mt-12 sm:-mt-16 border-[4px] border-[#050505] shadow-[0_0_20px_rgba(0,246,255,0.2)] z-30 overflow-hidden"
        >
          <motion.div 
            animate={{ opacity: isWorking ? [0.4, 0.8, 0.4] : 0.2 }} 
            transition={{ duration: 1.5, repeat: Infinity }}
            className="absolute inset-0 bg-[#00f6ff] blur-md" 
          />
          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-white rotate-45 z-10" />
        </motion.button>

        <DockItem label="Intel" icon={Terminal} />
        <DockItem label="Settings" icon={Settings} active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
      </div>
    </footer>
  );
}

function DockItem({ label, icon: Icon, active = false, onClick }: { label: string, icon?: any, active?: boolean, onClick?: () => void }) {
  return (
    <motion.button 
      onClick={onClick} 
      className="flex flex-col items-center group z-30"
      animate={{ scale: active ? 1.1 : 1, opacity: active ? 1 : 0.5 }}
      transition={springTransition}
      whileHover={{ opacity: 0.8 }}
    >
      {Icon && <Icon size={18} className={`mb-1.5 ${active ? 'text-[#00f6ff]' : 'text-white'}`} />}
      <span className={`text-[9px] font-mono uppercase tracking-widest ${active ? 'text-[#00f6ff]' : 'text-white'}`}>
        {label}
      </span>
      <motion.div 
        initial={false}
        animate={{ scale: active ? 1 : 0, opacity: active ? 1 : 0 }}
        className="w-1 h-1 rounded-full bg-[#00f6ff] mt-1.5 shadow-[0_0_5px_#00f6ff]" 
      />
    </motion.button>
  );
}

