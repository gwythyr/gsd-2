# pi-tui Package Analysis

## 1. Location
pi-tui is located at `/home/user/gsd-2/packages/pi-tui`

## 2. Package Information
- **Name**: @gsd/pi-tui
- **Version**: 0.57.1
- **Type**: Terminal User Interface library (vendored from pi-mono)
- **Main export**: ./dist/index.js

## 3. Key Finding: STANDALONE - No Pi SDK coupling

**NO dependencies on pi-coding-agent or pi-ai** - pi-tui is completely standalone.

Only external GSD deps:
- `@gsd/native/fd` (for file finding)
- `@gsd/native/text` (for text measurement/wrapping utilities)

## 4. Core Exports

**Components:** Text, Editor, Input, Box, Container, Spacer, Loader, CancellableLoader, SelectList, SettingsList, Markdown, TruncatedText, Image

**UI Core:** TUI, ProcessTerminal, Container, Component interface, Focusable interface

**Keyboard & Input:** Key, matchesKey(), parseKey(), isKeyRelease(), isKeyRepeat()

**Text Utilities:** truncateToWidth(), visibleWidth(), wrapTextWithAnsi()

**Autocomplete:** AutocompleteProvider, CombinedAutocompleteProvider, AutocompleteItem, SlashCommand

## 5. Adapter Strategy

**KEEP AS-IS** — pi-tui is SDK-agnostic, no changes needed. It's a pure terminal UI framework.
