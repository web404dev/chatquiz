import { spawn } from "node:child_process";
import { packOf, readPackStatus, SCHEDULE_DAYS, SCHEDULE_ORDER, WEB_ROOT, scheduleJobs } from "./jobs.js";

function run(pack, extraArgs = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [pack.script, ...(pack.args || []), ...extraArgs], {
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

const statuses = [];
for (const id of SCHEDULE_ORDER) {
  statuses.push(await readPackStatus(id));
}
const jobs = scheduleJobs(statuses);
for (const status of statuses) {
  const job = jobs.find((row) => row.id === status.id);
  const why = !job
    ? "유지"
    : job.args.includes("--fill-missing")
      ? `빈칸 ${status.needStill}`
      : "갱신";
  console.log(`${status.label} ${why} fetchedAt=${status.fetchedAt || 0}`);
}

if (!jobs.length) {
  console.log(`${SCHEDULE_DAYS}일 안이라 건너뜀`);
  process.exit(0);
}

const failed = [];
for (const job of jobs) {
  const pack = packOf(job.id);
  console.log(`== ${pack.label}${job.args.length ? ` ${job.args.join(" ")}` : ""}`);
  const code = await run(pack, job.args);
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
