export type GateMode = "strict" | "migrate" | "lenient";

export function getGateMode(): GateMode {
  const v = (process.env.FREE_AGENT_GATE_MODE || "migrate").toLowerCase();
  return (["strict","migrate","lenient"] as const).includes(v as any) ? (v as GateMode) : "migrate";
}

