import fs from "fs/promises";
import zlib from "zlib";

await Bun.build({
  entrypoints: [
    "src/react.ts",
    "src/plugin-react.ts",
    "src/store.ts",
    "src/preset-object.ts",
    "src/preset-array.ts",
    "src/plugin-persist.ts",
  ],
  outdir: "test/bundle-size/dist",
  external: ["react"],
  minify: true,
});

for (const bundle of await fs.readdir("test/bundle-size/dist")) {
  const path = `test/bundle-size/dist/${bundle}`;
  const size = await fs.stat(path).then((s) => s.size);
  const buffer = await fs.readFile(path);
  const gzipped = zlib.gzipSync(buffer).length;

  console.log(`${bundle}: ${size}B (${gzipped}B gzipped)`);
}
