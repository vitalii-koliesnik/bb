import { describe, expect, it } from "vitest";
import {
  createInstructionAssembly,
  measureInstructionText,
} from "./context-source-measurement.js";

const origin = {
  id: "docs",
  label: "Docs",
  kind: "workspace-instructions",
  pluginId: null,
  path: "/workspace/.bb/AGENTS.md",
} as const;

describe("instruction source measurement", () => {
  it("accounts for the exact assembled Unicode text, wrappers and separators", () => {
    const assembly = createInstructionAssembly();
    assembly.append(origin, "Heading", "é😀");
    assembly.append({ ...origin, id: "other" }, "Next");
    const result = assembly.finish();
    expect(result.instructions).toBe("Heading\n\né😀\n\nNext");
    expect(result.contextSources.total).toEqual(
      measureInstructionText(result.instructions),
    );
    expect(
      result.contextSources.sources.reduce(
        (total, source) => total + source.bytes,
        0,
      ),
    ).toBe(Buffer.byteLength(result.instructions));
    expect(measureInstructionText("é😀")).toMatchObject({
      characters: 2,
      bytes: 6,
      estimatedTokens: 1,
    });
    expect(JSON.stringify(result.contextSources)).not.toContain("Heading");
  });
  it("bounds source metadata without altering supplied text or undercounting the total", () => {
    const assembly = createInstructionAssembly();
    for (let index = 0; index < 513; index++)
      assembly.append({ ...origin, id: String(index) }, "abcd");
    const result = assembly.finish();
    expect(result.contextSources.sources).toHaveLength(512);
    expect(result.contextSources.omittedSources).toBe(1);
    expect(result.contextSources.total.bytes).toBe(513 * 4 + 512 * 2);
  });
});
