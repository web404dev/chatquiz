import { spawn } from "node:child_process";
import { isStale, packOf, readPackStatus, SCHEDULE_DAYS, SCHEDULE_ORDER, WEB_ROOT } from "./jobs.js";

function run(pack) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [pack.script, ...(pack.args || [])], {
      cwd: WEB_ROOT,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    child.stdout.setEncoding("utf8");
    child.stderr.setEncoding("utf8");
    child.stdout.on("data", (chunk) => process.stdout.write(chunk));
    child.stderr.on("data", (chunk) => process.stderr.write(chunk));
    child.on("error", reject);
    child.on("exit", (code) => resolve(Number(code) || 0));
  });
}

const stale = [];
for (const id of SCHEDULE_ORDER) {
  const status = await readPackStatus(id);
  const old = isStale(status?.fetchedAt, SCHEDULE_DAYS);
  console.log(`${status.label} ${old ? "갱신" : "유지"} fetchedAt=${status.fetchedAt || 0}`);
  if (old) stale.push(id);
}

if (!stale.length) {
  console.log(`${SCHEDULE_DAYS}일 안이라 건너뜀`);
  process.exit(0);
}

const failed = [];
for (const id of stale) {
  const pack = packOf(id);
  console.log(`== ${pack.label}`);
  const code = await run(pack);
  if (code !== 0) {
    console.error(`${pack.label} 실패 ${code}`);
    failed.push(pack.label);
  }
}
if (failed.length) {
  console.error(`스케줄 실패: ${failed.join(", ")} — 미완성 파일은 커밋하지 않음`);
  process.exit(1);
}
console.log("스케줄 갱신 끝");
