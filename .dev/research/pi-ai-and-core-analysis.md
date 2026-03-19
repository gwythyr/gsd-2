# Analysis: @gsd/pi-ai and @gsd/pi-agent-core

## @gsd/pi-ai (v0.57.1)

### Description
Unified LLM API layer. Provides a provider-agnostic streaming interface for multiple LLM backends (Anthropic, OpenAI, Google, Mistral, Bedrock, etc.).

### External Dependencies
- `@anthropic-ai/sdk` ^0.73.0
- `@aws-sdk/client-bedrock-runtime` ^3.983.0
- `@google/genai` ^1.40.0
- `@mistralai/mistralai` ^1.14.1
- `@sinclair/typebox` ^0.34.41 (JSON schema / type definitions for tool parameters)
- `ajv` ^8.17.1 + `ajv-formats` ^3.0.1 (tool argument validation)
- `chalk` ^5.6.2
- `openai` ^6.26.0
- `proxy-agent` ^6.5.0
- `undici` ^7.24.2
- `zod-to-json-schema` ^3.24.6
- `@gsd/native` (internal - used for `parseStreamingJson`)

### Exported Types

**Core message types** (`src/types.ts`):
- `KnownApi` - union of known API identifiers (e.g. "anthropic-messages", "openai-responses")
- `Api` - `KnownApi | (string & {})` (extensible string union)
- `KnownProvider` / `Provider` - union of known provider identifiers
- `ThinkingLevel` - `"minimal" | "low" | "medium" | "high" | "xhigh"`
- `ThinkingBudgets` - token budgets per thinking level
- `CacheRetention` - `"none" | "short" | "long"`
- `Transport` - `"sse" | "websocket" | "auto"`
- `StreamOptions` - base options for streaming (temperature, maxTokens, signal, apiKey, headers, etc.)
- `ProviderStreamOptions` - StreamOptions & Record<string, unknown>
- `SimpleStreamOptions` - StreamOptions + reasoning + thinkingBudgets
- `StreamFunction<TApi, TOptions>` - generic stream function signature
- `TextContent` - `{ type: "text"; text: string; textSignature?: string }`
- `ThinkingContent` - `{ type: "thinking"; thinking: string; thinkingSignature?: string; redacted?: boolean }`
- `ImageContent` - `{ type: "image"; data: string; mimeType: string }`
- `ToolCall` - `{ type: "toolCall"; id: string; name: string; arguments: Record<string, any> }`
- `ServerToolUseContent` - server-side tool use (e.g. web search)
- `WebSearchResultContent` - result of server-side tool execution
- `Usage` - token counts + cost breakdown
- `StopReason` - `"stop" | "length" | "toolUse" | "error" | "aborted"`
- `UserMessage` - `{ role: "user"; content: string | (TextContent | ImageContent)[]; timestamp: number }`
- `AssistantMessage` - full assistant response with content blocks, usage, stop reason
- `ToolResultMessage<TDetails>` - tool result with content, details, isError
- `Message` - `UserMessage | AssistantMessage | ToolResultMessage`
- `Tool<TParameters>` - tool definition with name, description, parameters (TSchema)
- `Context` - `{ systemPrompt?; messages; tools? }`
- `AssistantMessageEvent` - discriminated union of streaming events (start, text_delta, toolcall_end, done, error, etc.)
- `OpenAICompletionsCompat` / `OpenAIResponsesCompat` - compat settings for OpenAI-compatible APIs
- `OpenRouterRouting` / `VercelGatewayRouting` - routing preferences
- `Model<TApi>` - model definition with id, name, api, provider, baseUrl, cost, contextWindow, maxTokens, compat
- `TextSignatureV1` - message metadata signature

**Re-exported from @sinclair/typebox**:
- `Static` (type)
- `TSchema` (type)
- `Type` (value - schema builder)

**Stream utilities** (`src/stream.ts`):
- `stream()` - low-level streaming with provider-specific options
- `complete()` - await full response
- `streamSimple()` - simplified streaming with reasoning support
- `completeSimple()` - await full response with reasoning
- `getEnvApiKey()` - get API key from environment variables

**Event stream** (`src/utils/event-stream.ts`):
- `EventStream<T, R>` class - generic async iterable event stream with push/end/result()
- `AssistantMessageEventStream` class - typed EventStream for assistant messages
- `createAssistantMessageEventStream()` - factory function

**Model registry** (`src/models.ts`):
- `getModel(provider, modelId)` - lookup a model by provider + id
- `getProviders()` - list all known providers
- `getModels(provider)` - list all models for a provider
- `calculateCost(model, usage)` - compute cost from usage
- `supportsXhigh(model)` - check if model supports xhigh thinking
- `modelsAreEqual(a, b)` - compare two models

**API registry** (`src/api-registry.ts`):
- `ApiStreamFunction` / `ApiStreamSimpleFunction` - function type aliases
- `ApiProvider<TApi, TOptions>` - provider registration interface
- `registerApiProvider()` / `getApiProvider()` / `getApiProviders()`
- `unregisterApiProviders(sourceId)` / `clearApiProviders()`

**Validation** (`src/utils/validation.ts`):
- `validateToolCall(tools, toolCall)` - find tool + validate arguments via AJV
- `validateToolArguments(tool, toolCall)` - validate arguments against TypeBox schema

**Overflow detection** (`src/utils/overflow.ts`):
- `isContextOverflow(message, contextWindow?)` - detect context window overflow errors
- `getOverflowPatterns()` - get regex patterns for testing

**Helpers** (`src/utils/typebox-helpers.ts`):
- `StringEnum(values, options?)` - create a string enum TypeBox schema

**JSON parsing** (`src/utils/json-parse.ts`):
- `parseStreamingJson(partialJson)` - parse incomplete JSON during streaming (delegates to `@gsd/native`)

**OAuth types** (re-exported from `src/utils/oauth/types.ts`):
- `OAuthAuthInfo`, `OAuthCredentials`, `OAuthLoginCallbacks`, `OAuthPrompt`, `OAuthProviderId`, `OAuthProviderInterface`

**Environment** (`src/env-api-keys.ts`):
- `getEnvApiKey(provider)` - resolve API key from environment variables

**Provider implementations** (registered via side-effect imports):
- Anthropic, Azure OpenAI Responses, Google, Google Gemini CLI, Google Vertex, Mistral, OpenAI Completions, OpenAI Responses

### Shimming Assessment
**Hard to shim fully** due to:
1. Heavy provider SDK dependencies (anthropic, openai, google, mistral, bedrock) - each provider module imports its SDK
2. `@gsd/native` dependency for `parseStreamingJson`
3. Generated model registry (`models.generated.js`) with all model definitions

**Easy to shim partially** if you only need types + `streamSimple` via proxy:
- All types are pure TypeScript interfaces/type aliases - zero runtime cost
- `EventStream` class is self-contained (no external deps)
- `StringEnum` helper is trivial
- `validateToolArguments` uses AJV but gracefully degrades (returns raw args if AJV unavailable)
- If using a proxy stream function, you never need the provider SDKs

---

## @gsd/pi-agent-core (v0.57.1)

### Description
General-purpose agent core. Provides the `Agent` class and `agentLoop` for running LLM conversations with tool execution.

### External Dependencies
- **None in package.json** (`"dependencies": {}`)
- **Peer dependency on `@gsd/pi-ai`** (imported at runtime from `@gsd/pi-ai` in agent.ts, agent-loop.ts, proxy.ts)
- **Peer dependency on `@sinclair/typebox`** (imported for `Static`, `TSchema` types)

### Exported Types and Values

**Types** (`src/types.ts`):
- `StreamFn` - `(...args: Parameters<typeof streamSimple>) => ReturnType<typeof streamSimple> | Promise<...>`
- `ToolExecutionMode` - `"sequential" | "parallel"`
- `AgentToolCall` - extracted ToolCall type from AssistantMessage content
- `BeforeToolCallResult` - `{ block?: boolean; reason?: string }`
- `AfterToolCallResult` - `{ content?; details?; isError? }`
- `BeforeToolCallContext` / `AfterToolCallContext` - hook context interfaces
- `AgentLoopConfig` - full config for agent loop (extends SimpleStreamOptions)
- `ThinkingLevel` - `"off" | "minimal" | "low" | "medium" | "high" | "xhigh"` (note: includes "off", unlike pi-ai's version)
- `CustomAgentMessages` - empty interface for declaration merging
- `AgentMessage` - `Message | CustomAgentMessages[keyof CustomAgentMessages]`
- `AgentState` - full agent state (systemPrompt, model, thinkingLevel, tools, messages, isStreaming, etc.)
- **`AgentToolResult<T>`** - `{ content: (TextContent | ImageContent)[]; details: T }`
- `AgentToolUpdateCallback<T>` - `(partialResult: AgentToolResult<T>) => void`
- `AgentTool<TParameters, TDetails>` - extends `Tool` with `label` and `execute()` function
- `AgentContext` - `{ systemPrompt; messages: AgentMessage[]; tools?: AgentTool[] }`
- `AgentEvent` - discriminated union of agent lifecycle events (agent_start/end, turn_start/end, message_start/update/end, tool_execution_start/update/end)

**Agent class** (`src/agent.ts`):
- `AgentOptions` - constructor options
- `Agent` class - main agent with:
  - State management (systemPrompt, model, thinkingLevel, tools, messages)
  - Event subscription (`subscribe(fn)`)
  - Prompt/continue/abort/reset lifecycle
  - Steering and follow-up message queues
  - `streamFn` for custom LLM transport (defaults to `streamSimple`)
  - Before/after tool call hooks

**Agent loop functions** (`src/agent-loop.ts`):
- `agentLoop(prompts, context, config, signal?, streamFn?)` - start a new agent loop
- `agentLoopContinue(context, config, signal?, streamFn?)` - continue from existing context

**Proxy utilities** (`src/proxy.ts`):
- `ProxyAssistantMessageEvent` - proxy event type (bandwidth-optimized, no partial field)
- `ProxyStreamOptions` - extends SimpleStreamOptions with authToken + proxyUrl
- `streamProxy(model, context, options)` - stream via HTTP proxy server

### Shimming Assessment
**Very easy to shim**:
1. **Zero npm dependencies** - everything is pure TypeScript
2. All types are interfaces/type aliases - can be extracted without any runtime code
3. The `Agent` class and `agentLoop` depend on `@gsd/pi-ai` only for:
   - `streamSimple` (can be replaced via `streamFn` option)
   - `EventStream` class (simple, self-contained)
   - `validateToolArguments` (used in agent-loop for tool arg validation)
   - Type imports (zero runtime cost)
4. The `streamProxy` function is self-contained (just HTTP fetch + SSE parsing)

**To shim the types only**: Extract the type definitions from `src/types.ts` - they depend only on `@gsd/pi-ai` types (`TextContent`, `ImageContent`, `AssistantMessage`, `Message`, `Tool`, `Model`, `SimpleStreamOptions`) and `@sinclair/typebox` (`Static`, `TSchema`).

**To shim the full runtime**: Provide `@gsd/pi-ai` (or a subset: `EventStream`, `streamSimple`, `validateToolArguments`) and the agent-core code works as-is.

---

## Key Type: AgentToolResult

Located at `/home/user/gsd-2/packages/pi-agent-core/src/types.ts` (line 244):

```typescript
export interface AgentToolResult<T> {
    content: (TextContent | ImageContent)[];
    details: T;
}
```

Where `TextContent` and `ImageContent` come from `@gsd/pi-ai`:
- `TextContent = { type: "text"; text: string; textSignature?: string }`
- `ImageContent = { type: "image"; data: string; mimeType: string }`

The `details` field is a generic type parameter used for tool-specific metadata displayed in UI or logs.
