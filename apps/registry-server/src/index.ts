import express from "express";
import cors from "cors";
import {
  getAllSkills,
  getSkill,
  searchSkills,
  upsertSkill,
  deleteSkill,
  getDbPath,
} from "./db.js";
import type { SkillRow } from "./db.js";

const PORT = parseInt(process.env.PORT || "3001", 10);

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));

// Helper: convert a DB row to the public API shape
function toApiSkill(row: SkillRow) {
  return {
    name: row.name,
    title: row.title,
    description: row.description,
    version: row.version,
    owner: row.owner,
    maintainers: JSON.parse(row.maintainers || "[]"),
    license: row.license,
    tags: JSON.parse(row.tags || "[]"),
    supported_agents: JSON.parse(row.supported_agents || "[]"),
    risk_level: row.risk_level,
    visibility: row.visibility,
    approval_status: row.approval_status,
    published_at: row.published_at,
    published_by: row.published_by,
  };
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// List all skills with optional filtering
app.get("/api/skills", (req, res) => {
  const status = req.query.status as string | undefined;
  const agent = req.query.agent as string | undefined;
  const tag = req.query.tag as string | undefined;

  const rows = getAllSkills({ status, agent, tag });
  const skills = rows.map(toApiSkill);

  res.json({ skills, count: skills.length });
});

// Get a specific skill by name
app.get("/api/skills/:name", (req, res) => {
  const row = getSkill(req.params.name);
  if (!row) {
    return res.status(404).json({ error: "Skill not found" });
  }
  res.json(toApiSkill(row));
});

// Search skills with FTS5 + filters
app.get("/api/search", (req, res) => {
  const query = (req.query.q as string || "").trim();
  const statusFilter = req.query.status as string | undefined;
  const agentFilter = req.query.agent as string | undefined;
  const tagFilter = req.query.tag as string | undefined;
  const ownerFilter = req.query.owner as string | undefined;

  // If no query, return all matching skills (no FTS scoring)
  if (!query) {
    const rows = getAllSkills({ status: statusFilter, agent: agentFilter, tag: tagFilter });
    const results = rows.map(toApiSkill);
    return res.json({ query: "", count: results.length, results });
  }

  const rows = searchSkills(query, {
    status: statusFilter,
    agent: agentFilter,
    tag: tagFilter,
    owner: ownerFilter,
  });

  // FTS5 rank is a negative score (lower = better match).
  // Compute a positive score for the API response.
  // Transform rank to a 0-100 score: abs(rank), clamped and scaled
  const results = rows.map((row) => {
    const skill = toApiSkill(row);
    const rawScore = Math.abs(row.rank);
    const score = Math.min(100, Math.round(rawScore * 10));
    return { ...skill, score, matches: [`score:${score}`] };
  });

  res.json({ query, count: results.length, results });
});

// Publish (create or update) a skill
app.post("/api/publish", (req, res) => {
  const { skill, content } = req.body;

  if (!skill || !skill.name) {
    return res.status(400).json({ error: "Missing required fields: skill (with name)" });
  }
  if (typeof content !== "string") {
    return res.status(400).json({ error: "Missing required field: content (SKILL.md string)" });
  }

  const row = upsertSkill(skill.name, {
    title: skill.title || skill.name,
    description: skill.description || "",
    version: skill.version || "1.0.0",
    owner: skill.owner || "",
    maintainers: JSON.stringify(skill.maintainers || []),
    license: skill.license || "",
    tags: JSON.stringify(skill.tags || []),
    supported_agents: JSON.stringify(skill.supported_agents || []),
    risk_level: skill.risk_level || "low",
    visibility: skill.visibility || "internal",
    approval_status: skill.approval_status || "draft",
    published_at: new Date().toISOString(),
    published_by: skill.published_by || "anonymous",
    content,
  });

  res.json({ success: true, skill: toApiSkill(row) });
});

// Download SKILL.md content
app.get("/api/skills/:name/download", (req, res) => {
  const row = getSkill(req.params.name);
  if (!row) {
    return res.status(404).json({ error: "Skill not found" });
  }
  if (!row.content) {
    return res.status(404).json({ error: "Skill content not found" });
  }
  res.json({ name: row.name, version: row.version, content: row.content });
});

// Delete a skill
app.delete("/api/skills/:name", (req, res) => {
  const deleted = deleteSkill(req.params.name);
  if (!deleted) {
    return res.status(404).json({ error: "Skill not found" });
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🔌 Nitor SkillHub Registry Server`);
  console.log(`   URL:  http://localhost:${PORT}`);
  console.log(`   DB:   ${getDbPath()}`);
  console.log(`   Engine: SQLite + FTS5`);
  console.log("");
  console.log(`   Endpoints:`);
  console.log(`   GET    /api/health`);
  console.log(`   GET    /api/skills`);
  console.log(`   GET    /api/skills/:name`);
  console.log(`   GET    /api/skills/:name/download`);
  console.log(`   GET    /api/search?q=<query>&status=&agent=&tag=&owner=`);
  console.log(`   POST   /api/publish`);
  console.log(`   DELETE /api/skills/:name`);
});
