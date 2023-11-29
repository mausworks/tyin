import fs from "fs/promises";
import zlib from "zlib";

await Bun.build({
  entrypoints: [
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

for (const bundle of (await fs.readdir("test/bundle-size/dist")).sort()) {
  const path = `test/bundle-size/dist/${bundle}`;
  const size = await fs.stat(path).then((s) => s.size);
  const buffer = await fs.readFile(path);
  const gzipped = zlib.gzipSync(buffer).length;

  console.log(`${bundle}: ${size}B (${gzipped}B gzipped)`);
}
