/**
 * Free Agent API
 *
 * Minimal HTTP endpoint for task submissions to Free Agent orchestrator.
 * Exposes POST /tasks for submitting code generation tasks.
 */

import express, { Request, Response } from "express";
import { submit } from "@robinson_ai_systems/free-agent-mcp";

const app = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(express.json());

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({ ok: true, status: "Free Agent API running" });
});

// Submit task
app.post("/tasks", async (req: Request, res: Response) => {
  try {
    const { kind = "feature", detail, cwd = "." } = req.body || {};

    // Validate required fields
    if (!detail) {
      return res.status(400).json({
        ok: false,
        error: "Missing required field: detail"
      });
    }

    // Submit task to orchestrator
    const result = await submit({
      kind: kind as any,
      detail,
      cwd
    });

    res.json({
      ok: true,
      result
    });
  } catch (err: any) {
    console.error("[API] Error:", err);
    res.status(500).json({
      ok: false,
      error: String(err?.message || err)
    });
  }
});

// List available task kinds
app.get("/task-kinds", (req: Request, res: Response) => {
  res.json({
    ok: true,
    kinds: ["feature", "bugfix", "refactor", "research", "analysis", "optimization"]
  });
});

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("[API] Unhandled error:", err);
  res.status(500).json({
    ok: false,
    error: "Internal server error"
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Free Agent API listening on port ${PORT}`);
  console.log(`   POST /tasks - Submit a task`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /task-kinds - List available task kinds`);
});

export default app;

