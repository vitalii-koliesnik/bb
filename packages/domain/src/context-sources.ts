import { z } from "zod";

const measurementSchema = z.object({
  characters: z.number().int().nonnegative(),
  bytes: z.number().int().nonnegative(),
  estimatedTokens: z.number().int().nonnegative(),
  sha256: z.string().regex(/^[a-f0-9]{64}$/u),
});

export const contextSourceSchema = measurementSchema.extend({
  id: z.string().min(1).max(256),
  label: z.string().min(1).max(256),
  kind: z.enum([
    "core-instructions",
    "plugin-instructions",
    "user-instructions",
    "workspace-instructions",
  ]),
  pluginId: z.string().nullable(),
  path: z.string().nullable(),
});
export type ContextSource = z.infer<typeof contextSourceSchema>;

export const contextSourceBundleSchema = z.object({
  sources: z.array(contextSourceSchema).max(512),
  omittedSources: z.number().int().nonnegative(),
  total: measurementSchema,
});
export type ContextSourceBundle = z.infer<typeof contextSourceBundleSchema>;

export const contextSourcesSnapshotSchema = contextSourceBundleSchema.extend({
  requestId: z.string().min(1),
  capturedAt: z.iso.datetime(),
  boundary: z.literal("bb-runtime-supplied"),
  coverage: z.literal("bb-instructions-only"),
  retention: z.literal("unknown"),
  tokenMethod: z.literal("unicode-characters-divided-by-four"),
  instructionMode: z.enum(["append", "replace"]),
});
export type ContextSourcesSnapshot = z.infer<
  typeof contextSourcesSnapshotSchema
>;
