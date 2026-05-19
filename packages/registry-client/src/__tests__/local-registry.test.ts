import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtempSync, rmSync, existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { LocalRegistryClient } from "../local-registry.js";
import type { RegistrySkillEntry } from "../types.js";

describe("LocalRegistryClient", () => {
  let client: LocalRegistryClient;
  let tempDir: string;

  const sampleSkill: RegistrySkillEntry = {
    name: "spring-boot-api-security-review",
    title: "Spring Boot API Security Review",
    description: "Reviews Spring Boot REST APIs for common security issues.",
    version: "1.0.0",
    owner: "platform-security",
    maintainers: ["security@nitor.example"],
    license: "internal",
    tags: ["java", "spring-boot", "security"],
    supported_agents: ["codex", "claude-code"],
    risk_level: "medium",
    visibility: "internal",
    approval_status: "approved",
    published_at: "2024-01-01T00:00:00.000Z",
    published_by: "developer@nitor.example",
    storage_path: "/tmp/test-skill",
  };

  const anotherSkill: RegistrySkillEntry = {
    name: "react-performance-review",
    title: "React Performance Review",
    description: "Reviews React components for performance issues.",
    version: "0.1.0",
    owner: "fe-coe",
    maintainers: [],
    license: "internal",
    tags: ["react", "frontend", "performance"],
    supported_agents: ["codex", "cursor"],
    risk_level: "low",
    visibility: "team",
    approval_status: "draft",
    published_at: "2024-01-02T00:00:00.000Z",
    published_by: "fe-lead@nitor.example",
    storage_path: "/tmp/test-react",
  };

  const dockerSkill: RegistrySkillEntry = {
    name: "dockerfile-hardening-review",
    title: "Dockerfile Hardening Review",
    description: "Reviews Dockerfiles for security hardening best practices.",
    version: "1.2.0",
    owner: "devsecops-coe",
    maintainers: [],
    license: "internal",
    tags: ["docker", "security", "devops"],
    supported_agents: ["codex", "claude-code", "cursor"],
    risk_level: "medium",
    visibility: "internal",
    approval_status: "approved",
    published_at: "2024-01-03T00:00:00.000Z",
    published_by: "sec@nitor.example",
    storage_path: "/tmp/test-docker",
  };

  beforeEach(() => {
    // Create a temp directory for each test to ensure isolation
    tempDir = mkdtempSync(join(tmpdir(), "skillhub-test-"));
    client = new LocalRegistryClient(tempDir);
  });

  afterEach(() => {
    // Clean up temp directory
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  describe("addSkill", () => {
    it("should add a skill to the registry", async () => {
      await client.load();
      await client.addSkill(sampleSkill);
      const found = client.getSkill("spring-boot-api-security-review");
      expect(found).toBeDefined();
      expect(found?.name).toBe("spring-boot-api-security-review");
      expect(found?.version).toBe("1.0.0");
    });

    it("should update an existing skill", async () => {
      await client.load();
      await client.addSkill(sampleSkill);

      const updated = {
        ...sampleSkill,
        version: "2.0.0",
        approval_status: "draft",
      };
      await client.addSkill(updated);

      const found = client.getSkill("spring-boot-api-security-review");
      expect(found?.version).toBe("2.0.0");
      expect(found?.approval_status).toBe("draft");
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await client.load();
      await client.addSkill(sampleSkill);
      await client.addSkill(anotherSkill);
      await client.addSkill(dockerSkill);
    });

    it("should find skills by exact name match", () => {
      const results = client.search("react-performance-review");
      expect(results.length).toBeGreaterThan(0);
      expect(results[0].skill.name).toBe("react-performance-review");
      expect(results[0].score).toBeGreaterThanOrEqual(100);
    });

    it("should find skills by partial name match", () => {
      const results = client.search("security");
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(results.some((r) => r.skill.name.includes("security"))).toBe(true);
    });

    it("should find skills by tag match", () => {
      const results = client.search("docker");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((r) => r.skill.tags.includes("docker"))).toBe(true);
    });

    it("should return results sorted by score descending", () => {
      const results = client.search("security");
      for (let i = 1; i < results.length; i++) {
        expect(results[i - 1].score).toBeGreaterThanOrEqual(results[i].score);
      }
    });

    it("should return empty for unmatched query", () => {
      const results = client.search("zzzznonexistent");
      expect(results).toHaveLength(0);
    });

    it("should find skills by owner", () => {
      const results = client.search("fe-coe");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results[0].skill.owner).toBe("fe-coe");
    });
  });

  describe("getAllSkills", () => {
    beforeEach(async () => {
      await client.load();
      await client.addSkill(sampleSkill);
      await client.addSkill(anotherSkill);
    });

    it("should return all skills", () => {
      const all = client.getAllSkills();
      expect(all.length).toBe(2);
    });

    it("should return empty array when no skills exist", async () => {
      // Create a fresh client with a new temp dir for this test
      const freshDir = mkdtempSync(join(tmpdir(), "skillhub-empty-"));
      const freshClient = new LocalRegistryClient(freshDir);
      await freshClient.load();
      const all = freshClient.getAllSkills();
      expect(all).toEqual([]);
      rmSync(freshDir, { recursive: true, force: true });
    });
  });

  describe("removeSkill", () => {
    beforeEach(async () => {
      await client.load();
      await client.addSkill(sampleSkill);
    });

    it("should remove a skill by name", async () => {
      expect(client.getSkill(sampleSkill.name)).toBeDefined();

      const removed = await client.removeSkill(sampleSkill.name);
      expect(removed).toBe(true);
      expect(client.getSkill(sampleSkill.name)).toBeUndefined();
    });

    it("should return false if skill not found", async () => {
      const removed = await client.removeSkill("nonexistent");
      expect(removed).toBe(false);
    });
  });

  describe("getRegistryPath", () => {
    it("should return path within custom directory", () => {
      const path = client.getRegistryPath();
      expect(path).toBe(join(tempDir, "registry.json"));
    });
  });
});
