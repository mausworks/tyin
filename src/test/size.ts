import zlib from "zlib";
import fs from "fs/promises";

await Bun.build({
  entrypoints: [
    "src/test/_export-all.ts",
    "src/test/_export-common.ts",
    "src/hook.ts",
    "src/store.ts",
    "src/extend.ts",
    "src/plugin-object.ts",
    "src/plugin-array.ts",
    "src/plugin-persist.ts",
  ],
  outdir: "src/test/.dist",
  external: ["react"],
  minify: true,
});

let sizes: Record<string, { size: number; gzipped: number }> = {};

const measureDirectory = async (path: string) => {
  for (const entry of await fs.readdir(path, { withFileTypes: true })) {
    const fullPath = `${path}/${entry.name}`;

    if (entry.isDirectory()) {
      await measureDirectory(`${path}/${entry.name}`);
    } else {
      const size = await fs.stat(fullPath).then((s) => s.size);
      const buffer = await fs.readFile(fullPath);
      const gzipped = zlib.gzipSync(buffer).length;

      sizes[entry.name] = { size, gzipped };
    }
  }
};

await measureDirectory("src/test/.dist");

const nice = (name: string) => name.replace(/_/g, "").replace(/\.js$/, "");

for (const [name, { size, gzipped }] of Object.entries(sizes).sort(
  (a, b) => b[1].size - a[1].size
)) {
  console.log(`${nice(name)}: ${size} bytes, ${gzipped} gzipped`);
}

await fs.rm("src/test/.dist", { recursive: true });
