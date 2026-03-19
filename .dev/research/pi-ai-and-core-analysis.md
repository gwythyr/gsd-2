# pi-ai and pi-agent-core Analysis

## @gsd/pi-ai Usage in GSD src/

Only 15 imports across the codebase. Key symbols used:

| Symbol | Files | Shim Strategy |
|--------|-------|---------------|
| `StringEnum` | 7 files | Copy function (15 lines, wraps TypeBox) |
| `Message` | 1 (subagent) | Define locally or import from adapter |
| `AssistantMessage` | 2 files | Type definition |
| `AssistantMessageEvent` | 1 file (ttsr) | Type definition |
| `Api` | 1 file (memory-extractor) | Type definition |
| `Model` | 1 file (memory-extractor) | Type definition |
| `getEnvApiKey` | 1 file (key-manager) | Simple env var reader |

### StringEnum Implementation (copy-able)
```typescript
import { type TUnsafe, Type } from "@sinclair/typebox";
export function StringEnum<T extends readonly string[]>(
  values: T,
  options?: { description?: string; default?: T[number] },
): TUnsafe<T[number]> {
  return Type.Unsafe<T[number]>({
    type: "string",
    enum: values as any,
    ...(options?.description && { description: options.description }),
    ...(options?.default && { default: options.default }),
  });
}
```

## @gsd/pi-agent-core Usage

Only 1 import: `AgentToolResult` in subagent/index.ts

```typescript
export interface AgentToolResult<T> {
  content: (TextContent | ImageContent)[];
  details: T;
}
```

**Strategy:** Both packages can be shimmed with minimal code in the adapter.
