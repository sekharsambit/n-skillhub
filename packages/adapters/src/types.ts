import type { ParsedSkill } from "@nitor-skillhub/core";

export interface TranslatedSkill {
  filename: string;
  content: string;
}

export interface AgentAdapter {
  id: string;
  displayName: string;

  /**
   * Detect whether this agent is configured in the given project.
   */
  detect(projectPath: string): Promise<boolean>;

  /**
   * Get the base path where skills should be installed for this agent.
   */
  getInstallPath(projectPath: string): string;

  /**
   * Translate a parsed universal skill into the agent-specific format.
   */
  translate(skill: ParsedSkill): Promise<TranslatedSkill>;

  /**
   * Install a translated skill into the project for this agent.
   */
  install(skill: ParsedSkill, projectPath: string): Promise<void>;

  /**
   * Remove an installed skill from the project for this agent.
   */
  remove(skillName: string, projectPath: string): Promise<void>;
}
