import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

import fs from 'fs/promises';
import path from 'path';

export async function execute_command({ command }) {
  try {
    if (!command) return "Error: No command provided.";
    const { stdout, stderr } = await execAsync(command);
    const output = (stdout + stderr).trim() || "Success (no output)";
    const cwd = process.cwd();
    return `[CWD: ${cwd}]\n${output}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

export async function write_file({ filename, content }) {
  try {
    if (!filename || content === undefined) return "Error: write_file requires 'filename' and 'content'.";
    
    const absolutePath = path.resolve(filename);
    await fs.writeFile(absolutePath, content);
    return `Successfully wrote to ${absolutePath}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

export async function list_files({ directory = '.' } = {}) {
  try {
    const absolutePath = path.resolve(directory || '.');
    const files = await fs.readdir(absolutePath);
    return `Files in ${absolutePath}:\n${files.join('\n')}`;
  } catch (error) {
    return `Error: ${error.message}`;
  }
}
