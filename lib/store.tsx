"use client";

import React, { createContext, useContext, useState } from "react";

type Mode = "Persuasion Engine" | "Legal Rewrite" | "Authority Builder" | "Negotiation Stack" | "idle";
type ActiveView = "modes" | "vault" | "settings";
type Tier = "free" | "pro" | "black";

type ExecutionState = "idle" | "ready" | "thinking" | "executing" | "error";

interface SystemState {
  mode: Mode;
  routerHealth: "green" | "red";
  activeView: ActiveView;
  tier: Tier;
  executionState: ExecutionState;
  osMode: boolean;
  setMode: (mode: Mode) => void;
  setHealth: (health: "green" | "red") => void;
  setActiveView: (view: ActiveView) => void;
  setTier: (tier: Tier) => void;
  setExecutionState: (state: ExecutionState) => void;
  setOsMode: (osMode: boolean) => void;
}

const SystemContext = createContext<SystemState | undefined>(undefined);

export function SystemProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>("idle");
  const [routerHealth, setHealth] = useState<"green" | "red">("green");
  const [activeView, setActiveView] = useState<ActiveView>("modes");
  const [tier, setTier] = useState<Tier>("pro");
  const [executionState, setExecutionState] = useState<ExecutionState>("idle");
  const [osMode, setOsMode] = useState<boolean>(false);

  return (
    <SystemContext.Provider value={{ mode, routerHealth, activeView, tier, executionState, osMode, setMode, setHealth, setActiveView, setTier, setExecutionState, setOsMode }}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystemStore() {
  const context = useContext(SystemContext);
  if (!context) throw new Error("useSystemStore must be used within SystemProvider");
  return context;
}
