import Database from "better-sqlite3";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const DATA_DIR = process.env.REGISTRY_DATA_DIR || join(__dirname, "..", "data");
const DB_PATH = join(DATA_DIR, "registry.db");

export interface SkillRow {
  name: string;
  title: string;
  description: string;
  version: string;
  owner: string;
  maintainers: string;
  license: string;
  tags: string;
  supported_agents: string;
  risk_level: string;
  visibility: string;
  approval_status: string;
  published_at: string;
  published_by: string;
  content: string;
}

export interface SearchResultRow {
  name: string;
  title: string;
  description: string;
  version: string;
  owner: string;
  maintainers: string;
  license: string;
  tags: string;
  supported_agents: string;
  risk_level: string;
  visibility: string;
  approval_status: string;
  published_at: string;
  published_by: string;
  rank: number;
}

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  _db = new Database(DB_PATH);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");

  initSchema(_db);

  return _db;
}

function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS skills (
      rowid INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      version TEXT NOT NULL DEFAULT '1.0.0',
      owner TEXT NOT NULL DEFAULT '',
      maintainers TEXT NOT NULL DEFAULT '[]',
      license TEXT NOT NULL DEFAULT '',
      tags TEXT NOT NULL DEFAULT '[]',
      supported_agents TEXT NOT NULL DEFAULT '[]',
      risk_level TEXT NOT NULL DEFAULT 'low',
      visibility TEXT NOT NULL DEFAULT 'internal',
      approval_status TEXT NOT NULL DEFAULT 'draft',
      published_at TEXT NOT NULL,
      published_by TEXT NOT NULL DEFAULT 'anonymous',
      content TEXT NOT NULL DEFAULT ''
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS skills_fts USING fts5(
      name, title, description, tags, owner,
      content='skills',
      content_rowid='rowid',
      tokenize='porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS skills_ai AFTER INSERT ON skills BEGIN
      INSERT INTO skills_fts(rowid, name, title, description, tags, owner)
      VALUES (new.rowid, new.name, new.title, new.description, new.tags, new.owner);
    END;

    CREATE TRIGGER IF NOT EXISTS skills_ad AFTER DELETE ON skills BEGIN
      INSERT INTO skills_fts(skills_fts, rowid, name, title, description, tags, owner)
      VALUES ('delete', old.rowid, old.name, old.title, old.description, old.tags, old.owner);
    END;

    CREATE TRIGGER IF NOT EXISTS skills_au AFTER UPDATE ON skills BEGIN
      INSERT INTO skills_fts(skills_fts, rowid, name, title, description, tags, owner)
      VALUES ('delete', old.rowid, old.name, old.title, old.description, old.tags, old.owner);
      INSERT INTO skills_fts(rowid, name, title, description, tags, owner)
      VALUES (new.rowid, new.name, new.title, new.description, new.tags, new.owner);
    END;
  `);
}

/** Build a safe FTS5 query string from user input */
function buildFtsQuery(input: string): string {
  // Split into terms, filter out empty/short, join with AND
  const terms = input
    .split(/\s+/)
    .filter((t) => t.length > 0)
    .map((t) => {
      // Escape special FTS5 characters and wrap in quotes if needed
      const sanitized = t.replace(/['"*()^$~`:{}[\]\\]/g, "");
      if (sanitized.length === 0) return null;
      // Use prefix matching for partial word matches
      return `"${sanitized}"*`;
    })
    .filter((t): t is string => t !== null);

  return terms.join(" AND ");
}

// ── Public API ────────────────────────────────────────────────────────────

export function getAllSkills(filters?: {
  status?: string;
  agent?: string;
  tag?: string;
}): SkillRow[] {
  const db = getDb();
  let sql = "SELECT * FROM skills WHERE 1=1";
  const params: unknown[] = [];

  if (filters?.status) {
    sql += " AND approval_status = ?";
    params.push(filters.status);
  }
  if (filters?.agent) {
    sql += " AND supported_agents LIKE ?";
    params.push(`%${filters.agent}%`);
  }
  if (filters?.tag) {
    sql += " AND tags LIKE ?";
    params.push(`%${filters.tag}%`);
  }

  return db.prepare(sql).all(...params) as SkillRow[];
}

export function getSkill(name: string): SkillRow | undefined {
  const db = getDb();
  return db.prepare("SELECT * FROM skills WHERE name = ?").get(name) as SkillRow | undefined;
}

export function searchSkills(
  query: string,
  filters?: { status?: string; agent?: string; tag?: string; owner?: string }
): SearchResultRow[] {
  const db = getDb();

  const ftsQuery = buildFtsQuery(query);
  if (!ftsQuery) return [];

  // Use the content table for filtering and FTS for ranking
  let sql = `
    SELECT s.*, skills_fts.rank
    FROM skills_fts
    JOIN skills s ON s.rowid = skills_fts.rowid
    WHERE skills_fts MATCH ?
  `;
  const params: unknown[] = [ftsQuery];

  if (filters?.status) {
    sql += " AND s.approval_status = ?";
    params.push(filters.status);
  }
  if (filters?.agent) {
    sql += " AND s.supported_agents LIKE ?";
    params.push(`%${filters.agent}%`);
  }
  if (filters?.tag) {
    sql += " AND s.tags LIKE ?";
    params.push(`%${filters.tag}%`);
  }
  if (filters?.owner) {
    sql += " AND s.owner LIKE ?";
    params.push(`%${filters.owner}%`);
  }

  sql += " ORDER BY skills_fts.rank";

  return db.prepare(sql).all(...params) as SearchResultRow[];
}

export function upsertSkill(name: string, fields: Partial<SkillRow>): SkillRow {
  const db = getDb();

  const existing = db.prepare("SELECT * FROM skills WHERE name = ?").get(name) as SkillRow | undefined;

  if (existing) {
    const stmt = db.prepare(`
      UPDATE skills SET
        title = ?, description = ?, version = ?, owner = ?,
        maintainers = ?, license = ?, tags = ?, supported_agents = ?,
        risk_level = ?, visibility = ?, approval_status = ?,
        published_at = ?, published_by = ?, content = ?
      WHERE name = ?
    `);
    stmt.run(
      fields.title ?? existing.title,
      fields.description ?? existing.description,
      fields.version ?? existing.version,
      fields.owner ?? existing.owner,
      fields.maintainers ?? existing.maintainers,
      fields.license ?? existing.license,
      fields.tags ?? existing.tags,
      fields.supported_agents ?? existing.supported_agents,
      fields.risk_level ?? existing.risk_level,
      fields.visibility ?? existing.visibility,
      fields.approval_status ?? existing.approval_status,
      fields.published_at ?? existing.published_at,
      fields.published_by ?? existing.published_by,
      fields.content ?? existing.content,
      name
    );
  } else {
    const stmt = db.prepare(`
      INSERT INTO skills (name, title, description, version, owner, maintainers, license, tags, supported_agents, risk_level, visibility, approval_status, published_at, published_by, content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      name,
      fields.title ?? "",
      fields.description ?? "",
      fields.version ?? "1.0.0",
      fields.owner ?? "",
      fields.maintainers ?? "[]",
      fields.license ?? "",
      fields.tags ?? "[]",
      fields.supported_agents ?? "[]",
      fields.risk_level ?? "low",
      fields.visibility ?? "internal",
      fields.approval_status ?? "draft",
      fields.published_at ?? new Date().toISOString(),
      fields.published_by ?? "anonymous",
      fields.content ?? ""
    );
  }

  return getSkill(name)!;
}

export function deleteSkill(name: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM skills WHERE name = ?").run(name);
  return result.changes > 0;
}

export function getDbPath(): string {
  return DB_PATH;
}
