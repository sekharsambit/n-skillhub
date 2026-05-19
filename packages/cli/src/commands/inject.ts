import { Command } from "commander";
import { readFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";
import { parseSkillMarkdown } from "@nitor-skillhub/core";
import { codexAdapter } from "@nitor-skillhub/adapters";
import { claudeCodeAdapter } from "@nitor-skillhub/adapters";
import { cursorAdapter } from "@nitor-skillhub/adapters";

const adapters: Record<string, typeof codexAdapter> = {
  codex: codexAdapter,
  "claude-code": claudeCodeAdapter,
  cursor: cursorAdapter,
};

export const injectCommand = new Command("inject")
  .description("Inject a skill into a specific AI coding agent")
  .argument("<name>", "Skill name")
  .requiredOption("-a, --agent <agent>", "Target agent (codex, claude-code, cursor)")
  .option("-p, --project-path <path>", "Project path", process.cwd())
  .option("-s, --skill-path <path>", "Path to skill directory")
  .action(async (name: string, options) => {
    const agentId = options.agent;
    const projectPath = options.projectPath;
    const skillPath = options.skillPath || join(process.cwd(), name);

    console.log(chalk.blue(`💉 Injecting skill '${name}' into agent '${agentId}'...`));

    // Check if agent is supported
    const adapter = adapters[agentId];
    if (!adapter) {
      console.error(chalk.red(`❌ Unsupported agent: ${agentId}`));
      console.error(chalk.dim(`Supported agents: ${Object.keys(adapters).join(", ")}`));
      process.exit(1);
    }

    try {
      // Read and parse the skill
      const skillFile = join(skillPath, "SKILL.md");
      const content = await readFile(skillFile, "utf8");
      const parsed = parseSkillMarkdown(content);

      // Install using the adapter
      await adapter.install(parsed, projectPath);

      console.log(chalk.green(`✅ Installed ${parsed.metadata.name} to ${adapter.getInstallPath(projectPath)}`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`❌ Injection failed: ${error.message}`));
      }
      process.exit(1);
    }
  });
