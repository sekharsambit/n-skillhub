import matter from "gray-matter";
import { SkillMetadataSchema, type SkillMetadata } from "@nitor-skillhub/schemas";

export interface ParsedSkill {
  metadata: SkillMetadata;
  body: string;
  raw: string;
}

/**
 * Parse a SKILL.md file content into structured metadata and body.
 * Validates frontmatter against the SkillMetadataSchema.
 */
export function parseSkillMarkdown(content: string): ParsedSkill {
  const parsed = matter(content);
  const metadata = SkillMetadataSchema.parse(parsed.data);

  return {
    metadata,
    body: parsed.content.trim(),
    raw: content,
  };
}
