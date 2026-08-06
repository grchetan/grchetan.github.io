import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import fs from "fs";
import path from "path";

function versionPlugin(): Plugin {
  return {
    name: "vite-plugin-auto-version",
    buildStart() {
      const versionData = {
        version: Date.now().toString(),
        builtAt: new Date().toISOString(),
      };
      const publicDir = path.resolve(process.cwd(), "public");
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(path.join(publicDir, "version.json"), JSON.stringify(versionData, null, 2));
    },
  };
}

export default defineConfig({
  base: "/",
  plugins: [
    versionPlugin(),
    TanStackRouterVite({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  server: {
    port: 5173,
    open: true,
  },
});
