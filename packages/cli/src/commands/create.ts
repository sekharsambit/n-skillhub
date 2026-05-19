import { Command } from "commander";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";

export const createCommand = new Command("create")
  .description("Create a new skill scaffold")
  .argument("<name>", "Skill name (lowercase kebab-case)")
  .option("-o, --output <path>", "Output directory", process.cwd())
  .action(async (name: string, options) => {
    const skillDir = join(options.output, name);

    console.log(chalk.blue(`📝 Creating skill: ${name}`));

    // Validate name format
    if (!/^[a-z0-9-]+$/.test(name)) {
      console.error(chalk.red("❌ Error: Skill name must be lowercase kebab-case (e.g., my-skill-name)"));
      process.exit(1);
    }

    await mkdir(skillDir, { recursive: true });
    await mkdir(join(skillDir, "examples"), { recursive: true });
    await mkdir(join(skillDir, "tests"), { recursive: true });

    const skillContent = [
      "---",
      `name: ${name}`,
      `title: ${name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}`,
      "description: A short description of what this skill does.",
      "version: 0.1.0",
      "owner: your-team",
      "maintainers:",
      "  - your-team@nitor.example",
      "license: internal",
      "tags:",
      "  - your-tag",
      "supported_agents:",
      "  - codex",
      "  - claude-code",
      "  - cursor",
      "risk_level: low",
      "visibility: team",
      "approval_status: draft",
      "---",
      "",
      `# ${name
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")}`,
      "",
      "## When to use",
      "",
      "Describe when to apply this skill.",
      "",
      "## Inputs expected",
      "",
      "Describe what inputs the skill expects.",
      "",
      "## Steps",
      "",
      "1. First step.",
      "2. Second step.",
      "3. Third step.",
      "",
      "## Output format",
      "",
      "Describe the expected output format.",
      "",
      "## Guardrails",
      "",
      "- Safety rules and constraints.",
      "",
    ].join("\n");

    await writeFile(join(skillDir, "SKILL.md"), skillContent, "utf8");

    console.log(chalk.green(`✅ Created skill scaffold in ${skillDir}`));
    console.log(chalk.dim("Files:"));
    console.log(chalk.dim(`  ${join(skillDir, "SKILL.md")}`));
    console.log(chalk.dim(`  ${join(skillDir, "examples/")}`));
    console.log(chalk.dim(`  ${join(skillDir, "tests/")}`));
  });
