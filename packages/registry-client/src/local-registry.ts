import { existsSync } from "fs";
import { mkdir, readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join, dirname } from "path";
import type { LocalRegistry, RegistrySkillEntry, SearchResult } from "./types.js";

const DEFAULT_REGISTRY_DIR = join(homedir(), ".nitor-skill");

function createEmptyRegistry(): LocalRegistry {
  return {
    version: 1,
    skills: [],
  };
}

export class LocalRegistryClient {
  private registry: LocalRegistry | null = null;
  private registryDir: string;

  /**
   * @param customDir Optional custom registry directory. Defaults to ~/.nitor-skill.
   */
  constructor(customDir?: string) {
    this.registryDir = customDir ?? DEFAULT_REGISTRY_DIR;
  }

  /**
   * Get the path to the registry file.
   */
  getRegistryPath(): string {
    return join(this.registryDir, "registry.json");
  }

  /**
   * Get a temp directory for skill storage.
   */
  getStorageDir(): string {
    return join(this.registryDir, "storage");
  }

  /**
   * Load the registry from disk. Creates an empty registry if none exists.
   */
  async load(): Promise<LocalRegistry> {
    if (this.registry) {
      return this.registry;
    }

    const registryFile = this.getRegistryPath();

    if (!existsSync(registryFile)) {
      this.registry = createEmptyRegistry();
      return this.registry;
    }

    const content = await readFile(registryFile, "utf8");
    this.registry = JSON.parse(content) as LocalRegistry;
    return this.registry;
  }

  /**
   * Reset the in-memory registry state. Useful for testing.
   */
  reset(): void {
    this.registry = null;
  }

  /**
   * Save the current registry to disk.
   */
  async save(): Promise<void> {
    if (!this.registry) {
      throw new Error("Registry not loaded. Call load() first.");
    }

    await mkdir(dirname(this.getRegistryPath()), { recursive: true });
    await writeFile(this.getRegistryPath(), JSON.stringify(this.registry, null, 2), "utf8");
  }

  /**
   * Add a skill to the registry. If a skill with the same name exists,
   * it will be updated with the new version.
   */
  async addSkill(entry: RegistrySkillEntry): Promise<void> {
    await this.load();

    if (!this.registry) {
      throw new Error("Registry not available");
    }

    const existingIndex = this.registry.skills.findIndex(
      (s) => s.name === entry.name,
    );

    if (existingIndex >= 0) {
      this.registry.skills[existingIndex] = entry;
    } else {
      this.registry.skills.push(entry);
    }

    await this.save();
  }

  /**
   * Get a specific skill by name.
   */
  getSkill(name: string): RegistrySkillEntry | undefined {
    if (!this.registry) {
      return undefined;
    }
    return this.registry.skills.find((s) => s.name === name);
  }

  /**
   * Search skills by query string.
   * Matches against name, title, description, tags, and owner.
   * Returns results sorted by relevance score (highest first).
   */
  search(query: string): SearchResult[] {
    if (!this.registry) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    const terms = lowerQuery.split(/\s+/).filter(Boolean);

    const results: SearchResult[] = [];

    for (const skill of this.registry.skills) {
      const scoreAndMatches = this.scoreSkill(skill, terms, lowerQuery);
      if (scoreAndMatches.score > 0) {
        results.push({
          skill,
          ...scoreAndMatches,
        });
      }
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    return results;
  }

  /**
   * Get all skills in the registry.
   */
  getAllSkills(): RegistrySkillEntry[] {
    if (!this.registry) {
      return [];
    }
    return [...this.registry.skills];
  }

  /**
   * Remove a skill from the registry by name.
   */
  async removeSkill(name: string): Promise<boolean> {
    await this.load();

    if (!this.registry) {
      return false;
    }

    const initialLength = this.registry.skills.length;
    this.registry.skills = this.registry.skills.filter((s) => s.name !== name);

    if (this.registry.skills.length !== initialLength) {
      await this.save();
      return true;
    }

    return false;
  }

  /**
   * Score a skill against search terms.
   */
  private scoreSkill(
    skill: RegistrySkillEntry,
    terms: string[],
    fullQuery: string,
  ): { score: number; matches: string[] } {
    let score = 0;
    const matches: string[] = [];

    const searchableFields: Record<string, string> = {
      name: skill.name.toLowerCase(),
      title: skill.title.toLowerCase(),
      description: skill.description.toLowerCase(),
      owner: skill.owner.toLowerCase(),
      tags: skill.tags.join(" ").toLowerCase(),
    };

    // Exact phrase match on name (highest priority)
    if (searchableFields.name === fullQuery) {
      score += 100;
      matches.push(`name:${skill.name}`);
    }

    // Exact phrase match on title
    if (searchableFields.title === fullQuery) {
      score += 80;
      matches.push(`title:${skill.title}`);
    }

    // Check each term against each field
    for (const term of terms) {
      if (searchableFields.name.includes(term)) {
        score += 30;
        if (!matches.includes(`name:${skill.name}`)) {
          matches.push(`name:${skill.name}`);
        }
      }
      if (searchableFields.title.includes(term)) {
        score += 20;
        if (!matches.includes(`title:${skill.title}`)) {
          matches.push(`title:${skill.title}`);
        }
      }
      if (searchableFields.tags.includes(term)) {
        score += 15;
        matches.push(`tag:${term}`);
      }
      if (searchableFields.description.includes(term)) {
        score += 10;
        if (!matches.includes("description")) {
          matches.push("description");
        }
      }
      if (searchableFields.owner.includes(term)) {
        score += 5;
        if (!matches.includes(`owner:${skill.owner}`)) {
          matches.push(`owner:${skill.owner}`);
        }
      }
    }

    return { score, matches };
  }
}
