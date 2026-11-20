import { copyFile, mkdir, readdir } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const staticDir = path.join(root, "static");

const entries = await readdir(root, { withFileTypes: true });
const downloads = entries
  .filter(
    (entry) =>
      entry.isFile() &&
      (entry.name === "kdo-developer.tar.gz" ||
        entry.name === "agent-setup.sh" ||
        /^agent-setup-.*\.sh$/.test(entry.name))
  )
  .map((entry) => entry.name)
  .sort();

if (!downloads.includes("kdo-developer.tar.gz")) {
  console.error("缺少 kdo-developer.tar.gz，无法同步下载文件。");
  process.exit(1);
}

await mkdir(staticDir, { recursive: true });

for (const file of downloads) {
  await copyFile(path.join(root, file), path.join(staticDir, file));
}

console.log(`已同步 ${downloads.length} 个下载文件到 static/：${downloads.join(", ")}`);
