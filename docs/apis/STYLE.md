# Documentation Style Guide

This API reference follows a Playwright-like structure.

## Member Template

For each method/property/event, use:

- `## <memberName>`
- Short description
- `### Usage`
- `### Arguments`
- `### Returns`

## Rules

- Types and signatures must match `packages/core/src/types/types.d.ts`.    
- Do not document methods that are not present in `types.d.ts`.    
- Examples should be adapted from:    
  - `tests/extension/dist/src/sdk/**`    
  - `tests/extension/dist/src/demo/**`    
  - `apps/web-site/public/aut/**`    
- `expect(...)` methods return `void` in typings; examples should not use `await`.    

