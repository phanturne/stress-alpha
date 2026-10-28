/**
 * Financial Data Ingestion & 8-Module Scaffolding Pipeline
 *
 * Decomposed into modular components under ./financial-data/:
 * - types.ts: Schema interfaces, options, and localization mappings
 * - utils.ts: Math and API key helpers
 * - fetchers.ts: Massive, Finnhub, Polygon, and Yahoo Finance fetchers
 * - scaffolders.ts: Deterministic 8-module draft generators
 * - pipeline.ts: Bundle orchestration and artifact persistence
 */

export * from "./financial-data/index";
