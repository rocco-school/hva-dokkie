import { defineConfig, loadEnv } from "vite";
import { resolve } from "path";
import glob from "glob";
import eslint from "vite-plugin-eslint";

export default defineConfig((config) => {
    let htmlFiles: string[];

    if (config.mode === "development") {
        htmlFiles = glob.globSync("**/*.html", {
            cwd: resolve(__dirname, "./wwwroot"),
        });
    } else {
        htmlFiles = glob.globSync("wwwroot/**/*.html", {
            cwd: resolve(__dirname, "./"),
        });
    }

    const input: any = {};
    htmlFiles.forEach((e: string, i: number) => {
        input[`app_${i}`] = e;
    });

    const env = loadEnv(config.mode, process.cwd());

    return {
        base: "./",
        root: "wwwroot",
        appType: "mpa",
        resolve: {
            alias: {
                "/src": resolve(__dirname, "./src"),
            },
        },
        build: {
            sourcemap: true,
            rollupOptions: {
                input: input,
            },
            outDir: resolve(__dirname, "./dist"),
            emptyOutDir: true,
        },
        plugins: [eslint()],
        server: {
            strictPort: true,
            port: 3000,
        },
        define: {
            __HBOICTCLOUD_APIKEY__: JSON.stringify(env.VITE_HBOICTCLOUD_APIKEY),
            __HBOICTCLOUD_DATABASE__: JSON.stringify(env.VITE_HBOICTCLOUD_DATABASE),
        },
    };
});
