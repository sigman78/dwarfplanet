export type EntityId = number & { readonly __brand: 'EntityId' }

export type Point2d = { readonly x: number; readonly y: number }

export type ThingKind = 'item' | 'structure' | 'resource'
