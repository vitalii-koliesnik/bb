import { Command } from "commander";
import { action } from "../../action.js";
import { createCliBbSdk } from "../../client.js";
import { outputJson, requireThreadIdOrSelf } from "../helpers.js";

export function registerContextCommand(
  parent: Command,
  getUrl: () => string,
): void {
  parent
    .command("context [id]")
    .description(
      "Show the latest recorded context window usage and available breakdown",
    )
    .option("--self", "Use the current thread")
    .option("--json", "Print machine-readable JSON output")
    .action(
      action(
        async (
          id: string | undefined,
          opts: { self?: boolean; json?: boolean },
        ) => {
          const threadId = requireThreadIdOrSelf(id, opts);
          const result = await createCliBbSdk(getUrl()).threads.context({
            threadId,
          });
          if (outputJson(opts, result)) return;
          const sources = result.experimental_sources;
          if (sources) {
            console.log(
              `BB-supplied instructions: ~${sources.total.estimatedTokens.toLocaleString("en-US")} tokens (estimate; latest submission only)`,
            );
            console.log(`Supplied to agent runtime: ${sources.capturedAt}`);
            for (const source of sources.sources) {
              console.log(
                `  ${source.label}: ~${source.estimatedTokens.toLocaleString("en-US")} tokens / ${source.bytes.toLocaleString("en-US")} bytes`,
              );
            }
            if (sources.omittedSources > 0)
              console.log(
                `${sources.omittedSources} additional sources omitted from the list; total includes them.`,
              );
            console.log(
              "Coverage: BB instructions only. Provider-native documents, tool reads and retention are unknown. Estimates use Unicode characters / 4, including wrappers.",
            );
          }
          const usage = result.usage;
          if (!usage) {
            console.log("Context usage is not available yet.");
            return;
          }
          const count = (value: number) => value.toLocaleString("en-US");
          console.log(
            `${usage.estimated ? "Estimated context" : "Context window"}: ${count(usage.usedTokens)} / ${count(usage.modelContextWindow)} tokens`,
          );
          if (usage.cost) {
            console.log(
              `Session cost: ${usage.cost.amount} ${usage.cost.currency}`,
            );
          }
          if (!usage.snapshot) return;
          console.log(`Captured: ${usage.snapshot.capturedAt}`);
          for (const category of usage.snapshot.categories) {
            const kind = category.kind === "used" ? "" : ` (${category.kind})`;
            console.log(`${category.label}${kind}: ${count(category.tokens)}`);
            for (const entry of category.entries)
              console.log(`  ${entry.label}: ${count(entry.tokens)}`);
          }
        },
      ),
    );
}
