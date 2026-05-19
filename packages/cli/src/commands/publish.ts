import { Command } from "commander";
import { readFile, copyFile, mkdir } from "fs/promises";
import { join, dirname } from "path";
import { existsSync } from "fs";
import chalk from "chalk";
import { parseSkillMarkdown } from "@nitor-skillhub/core";
import { LocalRegistryClient, RemoteRegistryClient } from "@nitor-skillhub/registry-client";
import { SkillScanner } from "@nitor-skillhub/scanner";
import type { RegistrySkillEntry } from "@nitor-skillhub/registry-client";

export const publishCommand = new Command("publish")
  .description("Publish a skill to the local or remote registry")
  .argument("<path>", "Path to skill directory")
  .option("-r, --registry <url>", "Publish to a remote registry instead of local")
  .option("--published-by <email>", "Publisher email", "developer@nitor.example")
  .option("--skip-scan", "Skip security scanning before publish")
  .option("--force", "Publish even if high-severity findings are present")
  .action(async (skillPath: string, options) => {
    const resolvedPath = join(process.cwd(), skillPath);
    const skillFile = join(resolvedPath, "SKILL.md");

    console.log(chalk.blue(`📦 Publishing skill from ${resolvedPath}...`));

    // Validate skill directory exists
    if (!existsSync(skillFile)) {
      console.error(chalk.red(`❌ SKILL.md not found at ${skillFile}`));
      process.exit(1);
    }

    // Read and parse the skill
    let content: string;
    let parsed: ReturnType<typeof parseSkillMarkdown>;
    try {
      content = await readFile(skillFile, "utf8");
      parsed = parseSkillMarkdown(content);
    } catch (err) {
      console.error(chalk.red(`❌ Failed to parse skill: ${(err as Error).message}`));
      process.exit(1);
    }

    const metadata = parsed.metadata;

    // Security scan (unless skipped)
    if (!options.skipScan) {
      console.log(chalk.blue("🔬 Running security scan..."));
      const scanner = new SkillScanner();
      const scanResult = scanner.scan(parsed);

      if (scanResult.findings.length > 0) {
        console.log("");
        console.log(chalk.bold(`📋 ${scanResult.findings.length} finding(s):`));
        for (const finding of scanResult.findings) {
          const badge = finding.severity === "high" ? "🔴" : finding.severity === "medium" ? "🟡" : finding.severity === "low" ? "🔵" : "⚪";
          console.log(`  ${badge} [${finding.severity}] ${finding.ruleId}: ${finding.message}`);
        }
        console.log("");
      }

      if (!scanResult.passed && !options.force) {
        console.error(chalk.red(`❌ Publish blocked: ${scanResult.summary.high} high-severity finding(s) detected.`));
        console.error(chalk.yellow("  Use --force to publish anyway, or --skip-scan to skip scanning."));
        process.exit(1);
      }

      if (!scanResult.passed && options.force) {
        console.log(chalk.yellow("⚠ Publishing with --force despite high-severity findings."));
      }
    }

    // Build entry
    const entry: RegistrySkillEntry = {
      name: metadata.name,
      title: metadata.title,
      description: metadata.description,
      version: metadata.version,
      owner: metadata.owner,
      maintainers: metadata.maintainers,
      license: metadata.license || "",
      tags: metadata.tags,
      supported_agents: metadata.supported_agents,
      risk_level: metadata.risk_level,
      visibility: metadata.visibility,
      approval_status: metadata.approval_status || "draft",
      published_at: new Date().toISOString(),
      published_by: options.publishedBy,
      storage_path: "",
    };

    // Publish to remote registry
    if (options.registry) {
      console.log(chalk.blue(`🌐 Publishing to remote registry at ${options.registry}...`));
      try {
        const remote = new RemoteRegistryClient(options.registry);
        await remote.publish(entry, content);
        console.log(chalk.green("✅ Skill published to remote registry!"));
        console.log("");
        console.log(chalk.bold("📄 Summary:"));
        console.log(`  Name:       ${metadata.name}`);
        console.log(`  Version:    ${metadata.version}`);
        console.log(`  Owner:      ${metadata.owner}`);
        console.log(`  Registry:   ${options.registry}`);
      } catch (err) {
        console.error(chalk.red(`❌ Remote publish failed: ${(err as Error).message}`));
        process.exit(1);
      }
      return;
    }

    // Publish to local registry (existing behavior)
    const registry = new LocalRegistryClient();
    await registry.load();
    const registryPath = registry.getRegistryPath();
    const storageDir = join(dirname(registryPath), "storage", "skills", metadata.name);

    await mkdir(storageDir, { recursive: true });
    await copyFile(skillFile, join(storageDir, "SKILL.md"));

    entry.storage_path = join(storageDir, "SKILL.md");
    registry.addSkill(entry);
    await registry.save();

    console.log(chalk.green("✅ Skill published to local registry!"));
    console.log("");
    console.log(chalk.bold("📄 Summary:"));
    console.log(`  Name:       ${metadata.name}`);
    console.log(`  Version:    ${metadata.version}`);
    console.log(`  Owner:      ${metadata.owner}`);
    console.log(`  Visibility: ${metadata.visibility}`);
    console.log(`  Status:     ${entry.approval_status}`);
    console.log(`  Registry:   ${registry.getRegistryPath()}`);
  });
