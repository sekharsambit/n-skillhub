import { existsSync } from "fs";
import { mkdir, writeFile, rm } from "fs/promises";
import { join } from "path";
import type { ParsedSkill } from "@nitor-skillhub/core";
import type { AgentAdapter, TranslatedSkill } from "./types.js";

export const codexAdapter: AgentAdapter = {
  id: "codex",
  displayName: "Codex CLI",

  async detect(projectPath: string): Promise<boolean> {
    return existsSync(join(projectPath, ".codex"));
  },

  getInstallPath(projectPath: string): string {
    return join(projectPath, ".codex", "skills");
  },

  async translate(skill: ParsedSkill): Promise<TranslatedSkill> {
    return {
      filename: "SKILL.md",
      content: skill.raw,
    };
  },

  async install(skill: ParsedSkill, projectPath: string): Promise<void> {
    const dir = join(projectPath, ".codex", "skills", skill.metadata.name);
    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, "SKILL.md"), skill.raw, "utf8");
  },

  async remove(skillName: string, projectPath: string): Promise<void> {
    await rm(join(projectPath, ".codex", "skills", skillName), {
      recursive: true,
      force: true,
    });
  },
};
