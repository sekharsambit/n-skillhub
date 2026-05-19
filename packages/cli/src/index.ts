#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { createCommand } from "./commands/create.js";
import { validateCommand } from "./commands/validate.js";
import { injectCommand } from "./commands/inject.js";
import { publishCommand } from "./commands/publish.js";
import { searchCommand } from "./commands/search.js";
import { scanCommand } from "./commands/scan.js";
import { installCommand } from "./commands/install.js";

const program = new Command();

program
  .name("nitor-skill")
  .description("Nitor SkillHub — AI skill package manager")
  .version("0.1.0");

program.addCommand(initCommand);
program.addCommand(createCommand);
program.addCommand(validateCommand);
program.addCommand(injectCommand);
program.addCommand(publishCommand);
program.addCommand(searchCommand);
program.addCommand(scanCommand);
program.addCommand(installCommand);

program.parse(process.argv);
