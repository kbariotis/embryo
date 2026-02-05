import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import fs from 'fs/promises';
import path from 'path';

export async function execute_command({ command }, signal) {
  try {
    if (!command) return "Error: No command provided.";
    const { stdout, stderr } = await execAsync(command, { signal });
    const output = (stdout + stderr).trim() || "Success (no output)";
    const cwd = process.cwd();
    return `[CWD: ${cwd}]\n${output}`;
  } catch (error) {
    if (signal?.aborted || error.name === 'AbortError') {
      throw error;
    }
    return `Error: ${error.message}`;
  }
}

export async function write_file({ filename, content }, signal) {
  try {
    if (!filename || content === undefined) return "Error: write_file requires 'filename' and 'content'.";
    
    const absolutePath = path.resolve(filename);
    await fs.writeFile(absolutePath, content, { signal });
    return `Successfully wrote to ${absolutePath}`;
  } catch (error) {
    if (signal?.aborted || error.name === 'AbortError') {
      throw error;
    }
    return `Error: ${error.message}`;
  }
}

export async function list_files({ directory = '.' } = {}, signal) {
  try {
    const absolutePath = path.resolve(directory || '.');
    const files = await fs.readdir(absolutePath);
    return `Files in ${absolutePath}:\n${files.join('\n')}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

export async function execute_sandboxed_command({ command }, signal) {
  try {
    if (!command) return "Error: No command provided.";
    
    // Use a persistent Docker volume for the sandbox
    const volumeName = 'embryo_sandbox';
    const dockerCommand = `docker run --rm -v ${volumeName}:/workspace alpine sh -c "cd /workspace && ${command.replace(/"/g, '\\"')}"`;
    
    const { stdout, stderr } = await execAsync(dockerCommand, { signal });
    const output = (stdout + stderr).trim() || "Success (no output)";
    return `[Sandbox: /workspace]\n${output}`;
  } catch (error) {
    if (signal?.aborted || error.name === 'AbortError') {
      throw error;
    }
    return `Error (Sandbox): ${error.message}`;
  }
}
