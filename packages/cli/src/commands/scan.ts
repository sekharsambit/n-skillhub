import { Command } from "commander";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import { parseSkillMarkdown } from "@nitor-skillhub/core";
import { SkillScanner } from "@nitor-skillhub/scanner";

const SEVERITY_COLORS: Record<string, (s: string) => string> = {
  high: chalk.red,
  medium: chalk.yellow,
  low: chalk.cyan,
  info: chalk.gray,
};

export const scanCommand = new Command("scan")
  .description("Scan a skill for security issues and quality problems")
  .argument("<path>", "Path to skill directory")
  .option("--json", "Output results as JSON")
  .option("--fail-on <severity>", "Exit with code 1 if findings at this severity or above", "high")
  .action(async (skillPath: string, options) => {
    const resolvedPath = join(process.cwd(), skillPath);
    const skillFile = join(resolvedPath, "SKILL.md");

    if (!existsSync(skillFile)) {
      console.error(chalk.red(`❌ SKILL.md not found at ${skillFile}`));
      process.exit(1);
    }

    console.log(chalk.blue(`🔬 Scanning skill at ${resolvedPath}...`));

    try {
      const content = await readFile(skillFile, "utf8");
      const parsed = parseSkillMarkdown(content);
      const scanner = new SkillScanner();
      const result = scanner.scan(parsed);

      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
        return;
      }

      // Display results
      if (result.findings.length === 0) {
        console.log(chalk.green("✅ No issues found — skill looks clean!"));
        return;
      }

      console.log("");
      console.log(chalk.bold(`📋 ${result.findings.length} finding(s) found:`));
      console.log("");

      for (const finding of result.findings) {
        const color = SEVERITY_COLORS[finding.severity] ?? chalk.white;
        const badge = finding.severity === "high" ? "🔴" : finding.severity === "medium" ? "🟡" : finding.severity === "low" ? "🔵" : "⚪";
        console.log(`  ${badge} ${color.bold(finding.ruleId)} [${finding.severity}] ${finding.message}`);
        if (finding.lineNumber && finding.lineContent) {
          console.log(`     Line ${finding.lineNumber}: ${finding.lineContent.trim()}`);
        }
        if (finding.recommendation) {
          console.log(`     ${chalk.dim("Fix:")} ${finding.recommendation}`);
        }
        console.log("");
      }

      // Summary bar
      const s = result.summary;
      const parts: string[] = [];
      if (s.high > 0) parts.push(chalk.red(`${s.high} high`));
      if (s.medium > 0) parts.push(chalk.yellow(`${s.medium} medium`));
      if (s.low > 0) parts.push(chalk.cyan(`${s.low} low`));
      if (s.info > 0) parts.push(chalk.gray(`${s.info} info`));
      console.log(chalk.bold(`📊 Summary: ${parts.join(", ")}`));

      if (!result.passed) {
        const failLevel = options.failOn;
        const severityOrder = ["info", "low", "medium", "high"];
        const failIdx = severityOrder.indexOf(failLevel);
        const hasFailFindings = result.findings.some(
          (f) => severityOrder.indexOf(f.severity) >= failIdx
        );
        if (hasFailFindings) {
          console.log("");
          console.error(chalk.red("❌ Scan failed — findings exceed --fail-on threshold."));
          process.exit(1);
        }
      }

      console.log("");
      console.log(chalk.green("✅ Scan complete."));
    } catch (err) {
      console.error(chalk.red(`❌ Scan error: ${(err as Error).message}`));
      process.exit(1);
    }
  });
