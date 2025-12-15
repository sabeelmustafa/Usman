import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("\x1b[36m%s\x1b[0m", "🚀 Starting SchoolFlow Development Environment...");

// 1. Start Backend Server
console.log("\x1b[33m%s\x1b[0m", "-> Starting Backend Server on port 3001...");
const server = spawn('node', ['server.js'], { 
    stdio: 'inherit', 
    shell: true,
    cwd: __dirname
});

// 2. Start Vite Frontend
// Using 'npm run vite' which maps to the 'vite' command in package.json
console.log("\x1b[32m%s\x1b[0m", "-> Starting Vite Frontend...");
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const frontend = spawn(npmCmd, ['run', 'vite'], { 
    stdio: 'inherit', 
    shell: true,
    cwd: __dirname
});

// Cleanup on exit
const cleanup = () => {
    console.log("\n\x1b[31m%s\x1b[0m", "Shutting down servers...");
    server.kill();
    frontend.kill();
    process.exit();
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);