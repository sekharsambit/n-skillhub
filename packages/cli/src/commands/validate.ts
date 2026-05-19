import { Command } from "commander";
import { readFile } from "fs/promises";
import { join } from "path";
import chalk from "chalk";
import { parseSkillMarkdown } from "@nitor-skillhub/core";
import { ZodError } from "zod";

export const validateCommand = new Command("validate")
  .description("Validate a skill directory")
  .argument("<path>", "Path to skill directory")
  .action(async (skillPath: string) => {
    const resolvedPath = join(process.cwd(), skillPath);
    const skillFile = join(resolvedPath, "SKILL.md");

    console.log(chalk.blue(`🔍 Validating skill at ${resolvedPath}...`));

    try {
      const content = await readFile(skillFile, "utf8");
      const parsed = parseSkillMarkdown(content);

      console.log(chalk.green("✅ Skill is valid!"));
      console.log("");
      console.log(chalk.bold("Metadata:"));
      console.log(`  Name:        ${parsed.metadata.name}`);
      console.log(`  Title:       ${parsed.metadata.title}`);
      console.log(`  Version:     ${parsed.metadata.version}`);
      console.log(`  Owner:       ${parsed.metadata.owner}`);
      console.log(`  Risk Level:  ${parsed.metadata.risk_level}`);
      console.log(`  Visibility:  ${parsed.metadata.visibility}`);
      console.log(`  Status:      ${parsed.metadata.approval_status}`);
      console.log(`  Agents:      ${parsed.metadata.supported_agents.join(", ")}`);
      console.log(`  Tags:        ${parsed.metadata.tags.join(", ")}`);
      console.log(`  Body length: ${parsed.body.length} characters`);
    } catch (error) {
      if (error instanceof ZodError) {
        console.error(chalk.red("❌ Validation errors:"));
        for (const issue of error.issues) {
          console.error(chalk.red(`  - ${issue.path.join(".")}: ${issue.message}`));
        }
        process.exit(1);
      } else if (error instanceof Error) {
        console.error(chalk.red(`❌ Error: ${error.message}`));
        process.exit(1);
      }
    }
  });
