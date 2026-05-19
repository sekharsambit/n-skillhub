import { describe, it, expect } from "vitest";
import { SkillMetadataSchema } from "../skill.js";

describe("SkillMetadataSchema", () => {
  it("should parse valid skill metadata", () => {
    const result = SkillMetadataSchema.parse({
      name: "spring-boot-api-security-review",
      title: "Spring Boot API Security Review",
      description: "Reviews Spring Boot REST APIs for common security issues.",
      version: "1.0.0",
      owner: "platform-security",
      risk_level: "medium",
      visibility: "internal",
    });

    expect(result.name).toBe("spring-boot-api-security-review");
    expect(result.approval_status).toBe("draft");
    expect(result.maintainers).toEqual([]);
    expect(result.tags).toEqual([]);
    expect(result.supported_agents).toEqual([]);
  });

  it("should reject invalid skill name", () => {
    expect(() =>
      SkillMetadataSchema.parse({
        name: "Spring Boot API",
        title: "Spring Boot API",
        description: "Reviews Spring Boot REST APIs for common security issues.",
        version: "1.0.0",
        owner: "platform-security",
        risk_level: "medium",
        visibility: "internal",
      }),
    ).toThrow("Name must be lowercase kebab-case");
  });

  it("should reject empty title", () => {
    expect(() =>
      SkillMetadataSchema.parse({
        name: "test-skill",
        title: "AB",
        description: "Reviews Spring Boot REST APIs for common security issues.",
        version: "1.0.0",
        owner: "platform-security",
        risk_level: "medium",
        visibility: "internal",
      }),
    ).toThrow("Title must be at least 3 characters");
  });

  it("should reject invalid risk level", () => {
    expect(() =>
      SkillMetadataSchema.parse({
        name: "test-skill",
        title: "Test Skill",
        description: "Reviews Spring Boot REST APIs for common security issues.",
        version: "1.0.0",
        owner: "platform-security",
        risk_level: "critical",
        visibility: "internal",
      }),
    ).toThrow();
  });

  it("should accept all valid visibility values", () => {
    for (const v of ["private", "team", "internal"] as const) {
      const result = SkillMetadataSchema.parse({
        name: "test-skill",
        title: "Test Skill",
        description: "A test skill description.",
        version: "1.0.0",
        owner: "test-team",
        risk_level: "low",
        visibility: v,
      });
      expect(result.visibility).toBe(v);
    }
  });

  it("should accept all valid approval statuses", () => {
    for (const s of ["draft", "pending", "approved", "rejected"] as const) {
      const result = SkillMetadataSchema.parse({
        name: "test-skill",
        title: "Test Skill",
        description: "A test skill description.",
        version: "1.0.0",
        owner: "test-team",
        risk_level: "low",
        visibility: "team",
        approval_status: s,
      });
      expect(result.approval_status).toBe(s);
    }
  });

  it("should default maintainers to empty array", () => {
    const result = SkillMetadataSchema.parse({
      name: "test-skill",
      title: "Test Skill",
      description: "A test skill description.",
      version: "1.0.0",
      owner: "test-team",
      risk_level: "low",
      visibility: "team",
    });
    expect(result.maintainers).toEqual([]);
  });
});
