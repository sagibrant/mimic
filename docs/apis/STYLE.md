# Documentation Style Guide

This API reference follows a Playwright-like structure.

## Member Template

Each `.md` file may start with an optional `## Getting Started` section. Inside it, you may include any of:

- `### Usage`
- `### Arguments`
- `### Returns`
- `### Notes`

Group members into sections:

- `## Properties` (optional)
- `## Methods` (required)
- `## Events` (optional)

For each method/property/event member block, use:

- `---`
- `### <memberName>`
- Short description
- `#### Usage`
- `#### Arguments`
- `#### Returns`

## Rules

- Types and signatures must match `packages/core/src/types/types.d.ts`.    
- Do not document methods that are not present in `types.d.ts`.    
- Examples should be adapted from:    
  - `tests/extension/dist/src/sdk/**`    
  - `tests/extension/dist/src/demo/**`    
  - `apps/web-site/public/aut/**`    
- `expect(...)` methods return `void` in typings; examples should not use `await`.    
