import { Command } from "commander";
import { resolve } from "path";
import chalk from "chalk";
import { RemoteRegistryClient } from "@nitor-skillhub/registry-client";

export const installCommand = new Command("install")
  .description("Install a skill from the remote registry")
  .argument("<name>", "Skill name to install")
  .option("-r, --registry <url>", "Registry server URL")
  .option("-o, --output <path>", "Output directory for installed skill", process.cwd())
  .action(async (name: string, options) => {
    const registry = new RemoteRegistryClient(options.registry);
    const destDir = resolve(options.output);

    console.log(chalk.blue(`📥 Installing skill "${name}" from ${registry.getRegistryUrl()}...`));

    try {
      const result = await registry.install(name, destDir);

      console.log(chalk.green("✅ Skill installed successfully!"));
      console.log("");
      console.log(chalk.bold("📄 Details:"));
      console.log(`  Name:    ${result.name}`);
      console.log(`  Version: ${result.version}`);
      console.log(`  Path:    ${result.path}`);
    } catch (err) {
      console.error(chalk.red(`❌ Install failed: ${(err as Error).message}`));
      process.exit(1);
    }
  });
