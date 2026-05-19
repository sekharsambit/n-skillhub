import { Command } from "commander";
import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";

export const initCommand = new Command("init")
  .description("Initialize Nitor SkillHub in the current project")
  .option("-p, --path <path>", "Project path", process.cwd())
  .action(async (options) => {
    const projectPath = options.path;
    const skillhubDir = join(projectPath, ".nitor-skill");

    console.log(chalk.blue("🔧 Initializing Nitor SkillHub..."));

    if (existsSync(skillhubDir)) {
      console.log(chalk.yellow("⚠ Nitor SkillHub is already initialized in this project."));
      return;
    }

    // Create directory structure
    await mkdir(join(skillhubDir, "skills"), { recursive: true });
    await mkdir(join(skillhubDir, "cache"), { recursive: true });

    // Create config
    const config = {
      version: 1,
      project: projectPath.split("/").pop() || "unknown",
      agents: [] as string[],
      skills: [] as Array<{ name: string; version: string }>,
    };

    await writeFile(
      join(skillhubDir, "config.json"),
      JSON.stringify(config, null, 2),
      "utf8",
    );

    console.log(chalk.green(`✅ Initialized Nitor SkillHub in ${skillhubDir}`));
    console.log(chalk.dim("Created:"));
    console.log(chalk.dim(`  ${join(skillhubDir, "config.json")}`));
    console.log(chalk.dim(`  ${join(skillhubDir, "skills/")}`));
    console.log(chalk.dim(`  ${join(skillhubDir, "cache/")}`));
  });
