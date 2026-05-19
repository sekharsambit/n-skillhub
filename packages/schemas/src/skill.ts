import { z } from "zod";

export const SkillMetadataSchema = z.object({
  name: z.string().regex(/^[a-z0-9-]+$/, "Name must be lowercase kebab-case"),
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  version: z.string(),
  owner: z.string(),
  maintainers: z.array(z.string()).default([]),
  license: z.string().default("internal"),
  tags: z.array(z.string()).default([]),
  supported_agents: z.array(z.string()).default([]),
  risk_level: z.enum(["low", "medium", "high"]),
  visibility: z.enum(["private", "team", "internal"]),
  approval_status: z.enum(["draft", "pending", "approved", "rejected"]).default("draft"),
});

export type SkillMetadata = z.infer<typeof SkillMetadataSchema>;

export const SkillMetadataFrontmatterSchema = SkillMetadataSchema.extend({
  // Allow additional frontmatter fields that aren't in our schema
}).passthrough();
