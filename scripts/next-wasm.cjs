const path = require("node:path");
const { spawn } = require("node:child_process");

const resolveFromWorkspace = (request) =>
  require.resolve(request, { paths: [process.cwd()] });

process.env.NEXT_TEST_WASM_DIR = path.dirname(
  resolveFromWorkspace("@next/swc-wasm-nodejs/package.json"),
);

const nextBin = resolveFromWorkspace("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, ...process.argv.slice(2)], {
  env: process.env,
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});
