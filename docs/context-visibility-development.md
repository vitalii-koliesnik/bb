# Context visibility development fork

This fork adds the smallest source-measurement path for the Context Inspector widget.

## First slice

`GET /api/v1/threads/:id/context`, `sdk.threads.context({ threadId })`, and
`bb thread context <id> --json` expose `experimental_sources`. The existing usage
field remains independent. A new event records metadata only after a successful
thread start or turn submission to the agent runtime. Failed submissions do not
produce evidence. Context clear hides older evidence; compaction does not imply
retention. The response describes the latest successful submission, never a
cumulative count or a claim about what the model currently retains.

Each source includes a label, plugin/file origin, exact UTF-8 byte and Unicode
character counts, a SHA-256 of supplied text, and a characters/4 token estimate.
It measures the assembled contribution including wrappers and separators, after
selection and truncation. Source text is never stored in this new event. Up to
512 sources are returned, with an omitted count and a total covering all text.

Coverage is **BB instruction text only**: core tool instructions, plugin tool
instructions, static/dynamic plugin instructions, user AGENTS.md and workspace
.bb/AGENTS.md as assembled by BB. Provider-native AGENTS.md, skill catalogues,
skill bodies, remote documents and tool results remain unobserved. The
`bb-runtime-supplied` boundary establishes delivery to the runtime, not a complete
provider prompt or a provider acknowledgement of each individual source.

The host daemon protocol is incremented to 257. Use the fork's matching server
and daemon for development. No migration or change to the production data is
needed; events use the existing storage. Old clients tolerate the extra response
field; old servers omit it and the widget must show unavailable.

## Run an isolated editor and server

Prerequisites: Node >=22.19 and pnpm 9.15.0 (Corepack supported).

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm dev
```

The launcher prints the editor, server and daemon ports. It uses a checkout-specific
`~/.bb-dev/<instance>/` data directory and strips inherited thread context.
The editor proxies its API/WebSocket requests to that local server. For a built
instance without hot reload, use `pnpm start:worktree`. Do not use `pnpm desktop`
or plain production startup when you intend to preserve the installed instance.

## Verification

```sh
pnpm exec turbo run typecheck --filter=@bb/server --filter=@bb/host-daemon --filter=@bb/cli
pnpm exec turbo run test --filter=@bb/server --filter=@bb/host-daemon --filter=@bb/cli -- context-source-measurement context-supplied public-thread-context thread-runtime-config command-dispatch thread-context
```

The tests cover exact post-truncation measurement, Unicode, bounded metadata,
missing evidence, successful/failed submission, thread isolation, context clear
and CLI output without provider usage. No live paid provider turn is required.

## Widget next

One tag strip should consume `experimental_sources`, label its partial coverage,
and expand one source at a time. Do not use a skill catalogue or current file
sizes to fill gaps. The previous broad catalogue inspector is not installed.
Provider-native and tool-result provenance are a separate follow-up slice.
