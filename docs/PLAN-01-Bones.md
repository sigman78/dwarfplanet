# Plan 01 - First step of scaffolding project

Builds foundation and game core package. We are building physical layout, packages, scripts, all the scaffolding.
The game package should define base classes/interfaces, at top level: World, Actor, Map, then MapGen, ActorGen etc

## Game

- Root storage/interface class for all passive and active game data
- Incorporates world, actors, processors
- Interface to init, persist, run a step of the game
- Global seed fixed (deterministic for tests) random source

## World

- Main entry point and interface for all world top level operations
- Delegates all heavy work to aggregates
- Provides interface to init/manipulate/access state
- World globals
- Keeps the map instance
- Keeps actors ecs things
- Keeps whatever trainsient data needed for world upkeep
- Global world data - time, age, hyperparams

### Actor

- Actors are set of ECS managed components: position, health, subtype, etc

- World manages ECS (Miniplex) parts of the actor subsystem
- Separate file for Actor archetype definitions, actor builder (spawner), special processing functions

## Items/Objects

- That a special passive/lean actors - mostly objects on a map or in someones posession
- Objects could be stationary or pickable
- Objects have weight (per item), kind (raw material, food, tool), flags (consumable, equipable, craft material) quality and amount.
- Free laying objects are rendered on the map (or somehow displays over the tile)
- Generally actors are limited with up to 2 objects to carry


### Processor

- Manages ECS actor queries/slices
- Groups and executes in order ECS systems for actor archetypes
- Manages game subsystems

### Map

- Map could be configured to various sizes, default (medium) for now: 1024x512
- Left and right boundaries considered wrapping
- Map per-tile data is tightly packed into one or multiple typed arrays
- Map encodes biome, terrain type, passability, height/depth, climate/temp
- Client receives just encoded visual - tile type (in our case just color)
- Map could be altered by actors in some ways: direct (digging, cutting forest) or indirect - walking
- Another map layer - harvestable resource type and amount *for later*
- Has spatial hash for Actors/Objects for quick locating
- Navigation module (pathfinding) 

### ClientView

- Server side state of the client
- Tracks current client viewport to cull updates
- Tracks client 'visibility' of game data - for example fog of var *for later*

### Game events log

- Its a stream of freely defined game events mostly for displaying to the client
- Events has time, origination (global / actor-id / map position), importance, text
- Clients filter events by relevance, focused area, type - only filtered events are delivered to clients
- Example of events form living actors: Actor spawned/died, Animal attacked, Animal become angry
- Location events: City was founded, City raided, Famine in village
- Some basic compaction/throttling of events stream if many happens at once

## Plan 01 - Goals

- Good bones!
- Create project structure, setup dependencies, Packages wiring, required configs for tsc, pretty, lint
- Code core systems API interface and functionality
- Code supporting systems API and simplified functionality
- Need world map generator and setup
- Need items/objects map generator
- Define and setup minimalistic actors - animals, fishes
- Add basic logic for them - wander, gather, eat, migrate
- Create tests for relevant game parts - not just unit tests but sim verification
- Create minimalistic map generation / sim verification with text mode output


## Non-goal

- Do not need very detailed/realistic map generator
- No smart actors
- No complex part implementation
- No network, real clients
- No rendering except minimalistic terminal output


## Verification

- Should generate minimal map (approx 40x40) with various features
- Should populate map with simple agents
- Should run simulation steps and see what agents behave as expected
- Should validate minimal functionality per subsystem aspect

# Final

- Review, retrospective, what to do next
- Write all abovte to PLAN-01-RESULTS.md