import fs from "fs/promises";
import zlib from "zlib";

await Bun.build({
  entrypoints: [
    "src/test/export-all.ts",
    "src/test/export-object.ts",
    "src/test/export-object-no-persist.ts",
    "src/hook.ts",
    "src/store.ts",
    "src/extend.ts",
    "src/plugin-object.ts",
    "src/plugin-array.ts",
    "src/plugin-persist.ts",
  ],
  outdir: "test/bundle-size/dist",
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

await measureDirectory("test/bundle-size/dist");

for (const [name, { size, gzipped }] of Object.entries(sizes).sort(
  (a, b) => b[1].size - a[1].size
)) {
  console.log(`${name}: ${size} bytes (${gzipped} gzipped)`);
}
