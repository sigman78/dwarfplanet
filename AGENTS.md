# AGENTS.md for Dwarf Planet — Simulator

## What This Is

A this stage is PoC validating the typescript based client-server web tech stack for "Dwarf Planet" — a simulation game. 
Current target: solid game core with ecs, map, necessary wiring for populating a world with Actors, experimenting with their behavior.

Tiled map generation, tiled/chunked world sync, viewport-aware delta updates, ECS tick loop, 
multi-client support, and Canvas 2D rendering.

**This is NOT the game yet, mostly actor programming sandbox**

## Tech Stack

- Server runtime: Node.js with ES modules
- Server Networking: Colyseus
- ECS: Miniplex TS ECS
- Client: Vanilla TS + Vite
- Client rendering: HTML5 Canvas 2D
- Client UI overlays: Panels on top of canvas, lil-gui when tweaks needed or similar
- Transport: Colyseus WS on top of chunked/differential state
- Package manager:pnpm with workspaces

## Project Structure

Use workspaces to split code on packages and apps. Use proper @ aliases to reference in between.

```
repo/
  apps/
    client/
    server/
  packages/
    game/
    netproto/
    shared/
  package.json
  pnpm-workspace.json
  tsconfig.base.json
```

## Build and tests

Use individual package/scripts to run compilers, linters, tests, etc. Use `concurrently` to start client & server in dev mode

Tests are co-located with source as `*.test.ts` files. Run with `pnpm test` in each package.
Use barrel imports when needed.

## Coding Standards

- No comments in code unless explaining non obvious change
- No unicode/emoji in comments and string literals if not otherwise directed
- Discourage of using globals when not absolutely necessary

## Testing Requirements

- Cover code with tests. Prefer tests quality over quantity.
- Unit tests are only for small critical parts which possibly could fail. Do not test obvious
- Game logic if possible should be covered by edge cases tests



## Index

See @README.md - for project overview
@docs/LOG.md - append only changes log (update it)
