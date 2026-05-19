import { describe, it, expect } from "vitest";
import { parseSkillMarkdown } from "../parser.js";

describe("parseSkillMarkdown", () => {
  const validSkill = `---
name: spring-boot-api-security-review
title: Spring Boot API Security Review
description: Reviews Spring Boot REST APIs for common security issues.
version: 1.0.0
owner: platform-security
risk_level: medium
visibility: internal
supported_agents:
  - codex
  - claude-code
---

# Spring Boot API Security Review

## When to use

Use this skill when reviewing a Spring Boot REST API.

## Steps

1. Inspect authentication configuration.
2. Inspect authorization rules.
`;

  it("should parse valid skill markdown", () => {
    const result = parseSkillMarkdown(validSkill);

    expect(result.metadata.name).toBe("spring-boot-api-security-review");
    expect(result.metadata.title).toBe("Spring Boot API Security Review");
    expect(result.metadata.version).toBe("1.0.0");
    expect(result.metadata.supported_agents).toContain("codex");
    expect(result.metadata.risk_level).toBe("medium");
    expect(result.metadata.approval_status).toBe("draft");
  });

  it("should extract body content", () => {
    const result = parseSkillMarkdown(validSkill);

    expect(result.body).toContain("# Spring Boot API Security Review");
    expect(result.body).toContain("## When to use");
    expect(result.body).toContain("Inspect authentication configuration.");
  });

  it("should preserve raw content", () => {
    const result = parseSkillMarkdown(validSkill);
    expect(result.raw).toBe(validSkill);
  });

  it("should throw on invalid metadata", () => {
    const invalidSkill = `---
name: INVALID NAME
title: Bad
description: Short
version: 1.0.0
owner: test
risk_level: critical
visibility: team
---

Content here`;

    expect(() => parseSkillMarkdown(invalidSkill)).toThrow();
  });

  it("should throw when required fields are missing", () => {
    const missingFields = `---
name: test-skill
title: Test Skill
---

Content here`;

    expect(() => parseSkillMarkdown(missingFields)).toThrow();
  });

  it("should parse skill with all optional fields", () => {
    const fullSkill = `---
name: full-test-skill
title: Full Test Skill
description: A comprehensive test with all optional fields.
version: 2.0.0
owner: coe-team
maintainers:
  - coe@nitor.example
  - security@nitor.example
license: mit
tags:
  - java
  - testing
supported_agents:
  - codex
  - cursor
  - claude-code
risk_level: high
visibility: private
approval_status: approved
---

# Full Skill

Body content here.
`;

    const result = parseSkillMarkdown(fullSkill);

    expect(result.metadata.name).toBe("full-test-skill");
    expect(result.metadata.version).toBe("2.0.0");
    expect(result.metadata.maintainers).toHaveLength(2);
    expect(result.metadata.tags).toContain("java");
    expect(result.metadata.supported_agents).toContain("cursor");
    expect(result.metadata.approval_status).toBe("approved");
    expect(result.metadata.risk_level).toBe("high");
    expect(result.metadata.visibility).toBe("private");
  });
});
