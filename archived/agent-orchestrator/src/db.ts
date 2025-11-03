import SQLite from "better-sqlite3";
import { Client as PG } from "pg";
import { randomUUID } from "node:crypto";

const DB_PATH = process.env.AGENT_SQLITE_PATH || ".agent-data.sqlite";
export const neonUrl = process.env.NEON_DATABASE_URL;

export const db = new SQLite(DB_PATH);
db.exec(`
CREATE TABLE IF NOT EXISTS task_history (
  id TEXT PRIMARY KEY,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  user_prompt TEXT,
  plan_json TEXT,
  total_estimate_usd REAL,
  total_actual_usd REAL
);
CREATE TABLE IF NOT EXISTS step_history (
  id TEXT PRIMARY KEY,
  task_id TEXT,
  server TEXT,
  tool TEXT,
  params_json TEXT,
  result_json TEXT,
  estimate_usd REAL,
  actual_usd REAL,
  status TEXT,
  started_at TEXT DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT
);
`);

export function newTask(prompt: string, planJson: string, estUsd: number|null){
  const id = randomUUID();
  db.prepare(`INSERT INTO task_history (id, user_prompt, plan_json, total_estimate_usd) VALUES (?,?,?,?)`)
    .run(id, prompt, planJson, estUsd);
  return id;
}

export function logStep(taskId: string, server: string, tool: string, params: any, status: string, estimate?: number|null){
  const id = randomUUID();
  db.prepare(`INSERT INTO step_history (id, task_id, server, tool, params_json, status, estimate_usd) VALUES (?,?,?,?,?,?,?)`)
    .run(id, taskId, server, tool, JSON.stringify(params), status, estimate ?? null);
  return id;
}

export function finishStep(stepId: string, result: any, actualUsd?: number|null, status="ok"){
  db.prepare(`UPDATE step_history SET result_json=?, actual_usd=?, status=?, ended_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(JSON.stringify(result), actualUsd ?? null, status, stepId);
}

export async function replicateToNeon(taskId: string){
  if (!neonUrl) return;
  const pg = new PG({ connectionString: neonUrl, ssl: { rejectUnauthorized: false } });
  await pg.connect();
  await pg.query(`CREATE TABLE IF NOT EXISTS task_history (
    id TEXT PRIMARY KEY, created_at TIMESTAMPTZ DEFAULT NOW(), user_prompt TEXT, plan_json TEXT, total_estimate_usd REAL, total_actual_usd REAL
  );`);
  await pg.query(`CREATE TABLE IF NOT EXISTS step_history (
    id TEXT PRIMARY KEY, task_id TEXT, server TEXT, tool TEXT, params_json TEXT, result_json TEXT, estimate_usd REAL, actual_usd REAL, status TEXT, started_at TIMESTAMPTZ, ended_at TIMESTAMPTZ
  );`);
  const rowsTask = db.prepare(`SELECT * FROM task_history WHERE id=?`).get(taskId) as any;
  const rowsSteps = db.prepare(`SELECT * FROM step_history WHERE task_id=?`).all(taskId) as any[];
  await pg.query(`INSERT INTO task_history (id, created_at, user_prompt, plan_json, total_estimate_usd, total_actual_usd)
    VALUES ($1, NOW(), $2, $3, $4, $5) ON CONFLICT (id) DO NOTHING`,
    [rowsTask.id, rowsTask.user_prompt, rowsTask.plan_json, rowsTask.total_estimate_usd, rowsTask.total_actual_usd]);
  for (const s of rowsSteps) {
    await pg.query(`INSERT INTO step_history (id, task_id, server, tool, params_json, result_json, estimate_usd, actual_usd, status, started_at, ended_at)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`,
      [s.id, s.task_id, s.server, s.tool, s.params_json, s.result_json, s.estimate_usd, s.actual_usd, s.status]);
  }
  await pg.end();
}

