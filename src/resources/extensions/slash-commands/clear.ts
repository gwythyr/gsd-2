import type { ExtensionAPI, ExtensionCommandContext } from "@gsd/claude-code-adapter";

export default function clearCommand(pi: ExtensionAPI) {
  pi.registerCommand("clear", {
    description: "Alias for /new — start a new session",
    async handler(_args: string, ctx: ExtensionCommandContext) {
      await ctx.newSession();
    },
  });
}
