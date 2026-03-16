import { spawn } from "node:child_process";

const forwardedArgs = process.argv.slice(2);
const normalizedArgs = forwardedArgs[0] === "--" ? forwardedArgs.slice(1) : forwardedArgs;

const child = spawn("next", ["dev", ".", ...normalizedArgs], {
  stdio: "inherit",
  shell: true,
  env: process.env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
