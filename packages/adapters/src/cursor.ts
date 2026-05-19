import { existsSync } from "fs";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import type { ParsedSkill } from "@nitor-skillhub/core";
import type { AgentAdapter, TranslatedSkill } from "./types.js";

/**
 * Cursor adapter converts universal skills into .mdc rule files.
 * 
 * Cursor uses .mdc files in .cursor/skills/ with a YAML frontmatter
 * that describes glob patterns and applicability.
 */
export const cursorAdapter: AgentAdapter = {
  id: "cursor",
  displayName: "Cursor",

  async detect(projectPath: string): Promise<boolean> {
    return existsSync(join(projectPath, ".cursor"));
  },

  getInstallPath(projectPath: string): string {
    return join(projectPath, ".cursor", "skills");
  },

  async translate(skill: ParsedSkill): Promise<TranslatedSkill> {
    // Convert universal skill to Cursor .mdc format
    const frontmatter = [
      "---",
      `description: ${skill.metadata.description}`,
      "globs:",
      '  - "**/*"',
      "alwaysApply: false",
      "---",
      "",
    ].join("\n");

    const content = `${frontmatter}${skill.body}\n`;

    return {
      filename: `${skill.metadata.name}.mdc`,
      content,
    };
  },

  async install(skill: ParsedSkill, projectPath: string): Promise<void> {
    const { filename, content } = await this.translate(skill);
    const dir = join(projectPath, ".cursor", "skills");
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), content, "utf8");
  },

  async remove(skillName: string, projectPath: string): Promise<void> {
    const filePath = join(projectPath, ".cursor", "skills", `${skillName}.mdc`);
    await rm(filePath, { force: true });
  },
};
