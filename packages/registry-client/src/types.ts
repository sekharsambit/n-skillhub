/**
 * A skill entry stored in the local registry JSON file.
 */
export interface RegistrySkillEntry {
  name: string;
  title: string;
  description: string;
  version: string;
  owner: string;
  maintainers: string[];
  license: string;
  tags: string[];
  supported_agents: string[];
  risk_level: string;
  visibility: string;
  approval_status: string;
  published_at: string;
  published_by: string;
  storage_path: string;
}

/**
 * The local registry JSON file structure.
 */
export interface LocalRegistry {
  version: number;
  skills: RegistrySkillEntry[];
}

/**
 * Search result with a relevance score.
 */
export interface SearchResult {
  skill: RegistrySkillEntry;
  score: number;
  matches: string[];
}
