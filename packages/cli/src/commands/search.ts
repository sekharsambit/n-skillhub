import { Command } from "commander";
import chalk from "chalk";
import { LocalRegistryClient, RemoteRegistryClient } from "@nitor-skillhub/registry-client";
import type { SearchResult } from "@nitor-skillhub/registry-client";

function formatStatus(status: string): string {
  const colors: Record<string, (s: string) => string> = {
    approved: chalk.green,
    draft: chalk.yellow,
    pending: chalk.blue,
    rejected: chalk.red,
  };
  return (colors[status] || chalk.gray)(status);
}

function displayResults(results: SearchResult[]): void {
  if (results.length === 0) {
    console.log(chalk.yellow("No skills found matching your query."));
    return;
  }

  console.log(chalk.bold(`\n📋 ${results.length} result(s):\n`));

  for (const result of results) {
    const s = result.skill;
    console.log(`  ${chalk.bold(s.name)}  ${chalk.dim(`v${s.version}`)}`);
    console.log(`  ${s.title}`);
    console.log(`  ${chalk.dim(s.description)}`);
    console.log(`  Agents: ${s.supported_agents.join(", ")}  |  Owner: ${s.owner}  |  Status: ${formatStatus(s.approval_status || "draft")}  |  Score: ${result.score}`);
    if (result.matches.length > 0) {
      console.log(`  ${chalk.dim(`Matches: ${result.matches.join(", ")}`)}`);
    }
    if (s.tags.length > 0) {
      console.log(`  Tags: ${chalk.cyan(s.tags.join(", "))}`);
    }
    console.log("");
  }
}

export const searchCommand = new Command("search")
  .description("Search skills in the local or remote registry")
  .argument("<query>", "Search query")
  .option("-r, --registry <url>", "Search a remote registry instead of local")
  .option("--status <status>", "Filter by approval status (draft, pending, approved, rejected)")
  .option("--agent <agent>", "Filter by supported agent")
  .option("--tag <tag>", "Filter by tag")
  .option("--owner <owner>", "Filter by owner")
  .action(async (query: string, options) => {
    // Remote search
    if (options.registry) {
      console.log(chalk.blue(`🔍 Searching remote registry at ${options.registry} for "${query}"...`));
      try {
        const remote = new RemoteRegistryClient(options.registry);
        const results = await remote.search(query, {
          status: options.status,
          agent: options.agent,
          tag: options.tag,
          owner: options.owner,
        });
        displayResults(results);
      } catch (err) {
        console.error(chalk.red(`❌ Remote search failed: ${(err as Error).message}`));
        process.exit(1);
      }
      return;
    }

    // Local search
    console.log(chalk.blue(`🔍 Searching local registry for "${query}"...`));

    const registry = new LocalRegistryClient();
    await registry.load();

    let results = registry.search(query);

    if (options.status) {
      const statusFilter = options.status.toLowerCase();
      results = results.filter((r) => r.skill.approval_status?.toLowerCase() === statusFilter);
    }
    if (options.agent) {
      const agentFilter = options.agent.toLowerCase();
      results = results.filter((r) =>
        r.skill.supported_agents.some((a) => a.toLowerCase() === agentFilter)
      );
    }
    if (options.tag) {
      const tagFilter = options.tag.toLowerCase();
      results = results.filter((r) =>
        r.skill.tags.some((t) => t.toLowerCase() === tagFilter)
      );
    }
    if (options.owner) {
      const ownerFilter = options.owner.toLowerCase();
      results = results.filter((r) => r.skill.owner.toLowerCase() === ownerFilter);
    }

    displayResults(results);
  });
