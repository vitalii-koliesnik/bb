import {
  threadScope,
  type ContextSourceBundle,
  type InstructionMode,
} from "@bb/domain";
import type { CommandDispatchOptions } from "../command-dispatch-support.js";

export function recordSuppliedInstructions(
  options: Pick<CommandDispatchOptions, "eventSink">,
  args: {
    threadId: string;
    requestId: string;
    instructionMode: InstructionMode;
    contextSources: ContextSourceBundle | undefined;
  },
): void {
  if (args.contextSources === undefined) return;
  options.eventSink.emit({
    threadId: args.threadId,
    event: {
      type: "system/context-supplied",
      threadId: args.threadId,
      scope: threadScope(),
      snapshot: {
        ...args.contextSources,
        requestId: args.requestId,
        capturedAt: new Date().toISOString(),
        boundary: "bb-runtime-supplied",
        coverage: "bb-instructions-only",
        retention: "unknown",
        tokenMethod: "unicode-characters-divided-by-four",
        instructionMode: args.instructionMode,
      },
    },
  });
}
