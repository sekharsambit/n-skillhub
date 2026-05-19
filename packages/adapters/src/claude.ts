import { existsSync } from "fs";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import type { ParsedSkill } from "@nitor-skillhub/core";
import type { AgentAdapter, TranslatedSkill } from "./types.js";

export const claudeCodeAdapter: AgentAdapter = {
  id: "claude-code",
  displayName: "Claude Code",

  async detect(projectPath: string): Promise<boolean> {
    return existsSync(join(projectPath, ".claude"));
  },

  getInstallPath(projectPath: string): string {
    return join(projectPath, ".claude", "skills");
  },

  async translate(skill: ParsedSkill): Promise<TranslatedSkill> {
    return {
      filename: "SKILL.md",
      content: skill.raw,
    };
  },

  async install(skill: ParsedSkill, projectPath: string): Promise<void> {
    const dir = join(projectPath, ".claude", "skills", skill.metadata.name);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "SKILL.md"), skill.raw, "utf8");
  },

  async remove(skillName: string, projectPath: string): Promise<void> {
    await rm(join(projectPath, ".claude", "skills", skillName), {
      recursive: true,
      force: true,
    });
  },
};
