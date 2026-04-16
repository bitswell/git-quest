import { defineConfig, type ViteDevServer } from "vite";

function mossHostname() {
  return {
    name: "moss-hostname",
    configureServer(server: ViteDevServer) {
      const original = server.printUrls;
      server.printUrls = () => {
        original();
        const port =
          server.config.server.port ??
          (server.httpServer?.address() as { port: number } | null)?.port ??
          5173;
        const base = server.config.base;
        console.log(
          `  \x1b[32m➜\x1b[0m  \x1b[1mmoss:\x1b[0m   http://moss:${port}${base}`
        );
      };
    },
  };
}

export default defineConfig({
  root: ".",
  base: "/git-quest/",
  plugins: [mossHostname()],
  server: {
    host: "0.0.0.0",
    allowedHosts: ["moss"],
  },
  build: {
    outDir: "dist",
  },
});
