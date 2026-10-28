import { createHash } from "node:crypto";
import type { ContextSource, ContextSourceBundle } from "@bb/domain";

type SourceOrigin = Pick<
  ContextSource,
  "id" | "label" | "kind" | "pluginId" | "path"
>;

export function measureInstructionText(text: string) {
  const characters = Array.from(text).length;
  return {
    characters,
    bytes: Buffer.byteLength(text, "utf8"),
    estimatedTokens: Math.ceil(characters / 4),
    sha256: createHash("sha256").update(text).digest("hex"),
  };
}

export function createInstructionAssembly() {
  let instructions = "";
  let omittedSources = 0;
  const sources: ContextSource[] = [];
  return {
    append(origin: SourceOrigin, ...parts: string[]) {
      const text = (instructions.length > 0 ? "\n\n" : "") + parts.join("\n\n");
      instructions += text;
      if (sources.length < 512) {
        sources.push({
          ...origin,
          id: origin.id.slice(0, 256),
          label: origin.label.slice(0, 256),
          ...measureInstructionText(text),
        });
      } else {
        omittedSources++;
      }
    },
    finish(): { instructions: string; contextSources: ContextSourceBundle } {
      return {
        instructions,
        contextSources: {
          sources,
          omittedSources,
          total: measureInstructionText(instructions),
        },
      };
    },
  };
}
