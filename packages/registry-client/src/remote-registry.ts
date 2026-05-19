import { resolve } from "path";
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import type { RegistrySkillEntry, SearchResult } from "./types.js";

const DEFAULT_REGISTRY_URL = "http://localhost:3001";

interface SearchResponse {
  query: string;
  count: number;
  results: (RegistrySkillEntry & { score?: number; matches?: string[] })[];
}

interface DownloadResponse {
  name: string;
  version: string;
  content: string;
}

export interface RemoteSearchOptions {
  status?: string;
  agent?: string;
  tag?: string;
  owner?: string;
}

export class RemoteRegistryClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = (baseUrl || DEFAULT_REGISTRY_URL).replace(/\/+$/, "");
  }

  /**
   * Get the configured registry URL.
   */
  getRegistryUrl(): string {
    return this.baseUrl;
  }

  /**
   * Search for skills on the remote registry.
   */
  async search(query: string, filters?: RemoteSearchOptions): Promise<SearchResult[]> {
    const params = new URLSearchParams({ q: query });
    if (filters?.status) params.set("status", filters.status);
    if (filters?.agent) params.set("agent", filters.agent);
    if (filters?.tag) params.set("tag", filters.tag);
    if (filters?.owner) params.set("owner", filters.owner);

    const url = `${this.baseUrl}/api/search?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Registry search failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as SearchResponse;

    return data.results.map((entry) => ({
      skill: {
        name: entry.name,
        title: entry.title,
        description: entry.description,
        version: entry.version,
        owner: entry.owner,
        maintainers: entry.maintainers,
        license: entry.license,
        tags: entry.tags,
        supported_agents: entry.supported_agents,
        risk_level: entry.risk_level,
        visibility: entry.visibility,
        approval_status: entry.approval_status,
        published_at: entry.published_at,
        published_by: entry.published_by,
        storage_path: entry.storage_path || "",
      },
      score: entry.score ?? 0,
      matches: entry.matches ?? [],
    }));
  }

  /**
   * Install (download) a skill from the remote registry to a local directory.
   */
  async install(name: string, destDir: string): Promise<{ name: string; version: string; content: string; path: string }> {
    const url = `${this.baseUrl}/api/skills/${encodeURIComponent(name)}/download`;
    const res = await fetch(url);

    if (!res.ok) {
      if (res.status === 404) {
        throw new Error(`Skill "${name}" not found in registry at ${this.baseUrl}`);
      }
      throw new Error(`Failed to download skill: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as DownloadResponse;

    const skillDir = resolve(destDir, name);
    if (!existsSync(skillDir)) {
      await mkdir(skillDir, { recursive: true });
    }

    const skillFile = resolve(skillDir, "SKILL.md");
    await writeFile(skillFile, data.content, "utf8");

    return {
      name: data.name,
      version: data.version,
      content: data.content,
      path: skillFile,
    };
  }

  /**
   * Publish a skill to the remote registry.
   */
  async publish(skill: RegistrySkillEntry, content: string): Promise<void> {
    const url = `${this.baseUrl}/api/publish`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ skill, content }),
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({} as Record<string, unknown>));
      throw new Error(`Registry publish failed: ${res.status} ${(errBody as { error?: string }).error || res.statusText}`);
    }
  }
}
