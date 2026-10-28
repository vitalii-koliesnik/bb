import { describe, expect, it, vi } from "vitest";
import { threadEventSchema } from "@bb/domain";
import { recordSuppliedInstructions } from "./context-supplied.js";

describe("supplied instruction metadata", () => {
  it("does not turn absent metadata into an empty injection claim", () => {
    const emit = vi.fn();
    recordSuppliedInstructions(
      { eventSink: { emit, flush: async () => {} } },
      {
        threadId: "t",
        requestId: "r",
        instructionMode: "append",
        contextSources: undefined,
      },
    );
    expect(emit).not.toHaveBeenCalled();
  });
  it("records request correlation and limited coverage without source content", () => {
    const emit = vi.fn();
    recordSuppliedInstructions(
      { eventSink: { emit, flush: async () => {} } },
      {
        threadId: "t",
        requestId: "r",
        instructionMode: "append",
        contextSources: {
          sources: [],
          omittedSources: 0,
          total: {
            characters: 0,
            bytes: 0,
            estimatedTokens: 0,
            sha256: "0".repeat(64),
          },
        },
      },
    );
    const event = threadEventSchema.parse(emit.mock.calls[0]?.[0].event);
    expect(event).toMatchObject({
      type: "system/context-supplied",
      scope: { kind: "thread" },
      snapshot: {
        requestId: "r",
        boundary: "bb-runtime-supplied",
        coverage: "bb-instructions-only",
        retention: "unknown",
      },
    });
  });
});
