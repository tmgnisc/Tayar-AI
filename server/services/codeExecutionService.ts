import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, unlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const execAsync = promisify(exec);

interface ExecutionResult {
  status: 'success' | 'error' | 'timeout';
  output?: string;
  error?: string;
  executionTime?: number;
  memoryUsed?: number;
}

const TIMEOUT = 5000; // 5 seconds max execution time
const MAX_OUTPUT_LENGTH = 10000; // 10KB max output

/**
 * Execute JavaScript code using Node.js
 */
async function executeJavaScript(code: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  const tempFileName = `${randomBytes(16).toString('hex')}.js`;
  const tempFilePath = join(tmpdir(), tempFileName);

  try {
    // Write code to temp file
    await writeFile(tempFilePath, code);

    // Execute with Node.js
    const { stdout, stderr } = await execAsync(`node "${tempFilePath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    const executionTime = (Date.now() - startTime) / 1000;
    const output = (stdout + stderr).trim().slice(0, MAX_OUTPUT_LENGTH);

    return {
      status: 'success',
      output: output || '(No output)',
      executionTime,
    };
  } catch (error: any) {
    const executionTime = (Date.now() - startTime) / 1000;

    if (error.killed && error.signal === 'SIGTERM') {
      return {
        status: 'timeout',
        error: `Execution timeout (maximum ${TIMEOUT / 1000} seconds)`,
        executionTime,
      };
    }

    const errorOutput = (error.stdout || '') + (error.stderr || '');
    return {
      status: 'error',
      error: errorOutput.trim().slice(0, MAX_OUTPUT_LENGTH) || error.message,
      executionTime,
    };
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFilePath);
    } catch (e) {
      console.error('Failed to delete temp file:', tempFilePath);
    }
  }
}

/**
 * Execute Python code using Python 3
 */
async function executePython(code: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  const tempFileName = `${randomBytes(16).toString('hex')}.py`;
  const tempFilePath = join(tmpdir(), tempFileName);

  try {
    // Write code to temp file
    await writeFile(tempFilePath, code);

    // Execute with Python 3
    const { stdout, stderr } = await execAsync(`python3 "${tempFilePath}"`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    const executionTime = (Date.now() - startTime) / 1000;
    const output = (stdout + stderr).trim().slice(0, MAX_OUTPUT_LENGTH);

    return {
      status: 'success',
      output: output || '(No output)',
      executionTime,
    };
  } catch (error: any) {
    const executionTime = (Date.now() - startTime) / 1000;

    if (error.killed && error.signal === 'SIGTERM') {
      return {
        status: 'timeout',
        error: `Execution timeout (maximum ${TIMEOUT / 1000} seconds)`,
        executionTime,
      };
    }

    const errorOutput = (error.stdout || '') + (error.stderr || '');
    return {
      status: 'error',
      error: errorOutput.trim().slice(0, MAX_OUTPUT_LENGTH) || error.message,
      executionTime,
    };
  } finally {
    // Clean up temp file
    try {
      await unlink(tempFilePath);
    } catch (e) {
      console.error('Failed to delete temp file:', tempFilePath);
    }
  }
}

/**
 * Execute Java code
 */
async function executeJava(code: string): Promise<ExecutionResult> {
  const startTime = Date.now();
  const className = extractJavaClassName(code) || 'Solution';
  const tempFileName = `${className}.java`;
  const tempDir = join(tmpdir(), `java_${randomBytes(8).toString('hex')}`);
  const tempFilePath = join(tempDir, tempFileName);

  try {
    // Create temp directory
    await execAsync(`mkdir -p "${tempDir}"`);

    // Write code to temp file
    await writeFile(tempFilePath, code);

    // Compile Java code
    const { stderr: compileStderr } = await execAsync(`javac "${tempFilePath}"`, {
      timeout: TIMEOUT,
      cwd: tempDir,
    });

    if (compileStderr) {
      return {
        status: 'error',
        error: `Compilation Error:\n${compileStderr.trim().slice(0, MAX_OUTPUT_LENGTH)}`,
        executionTime: (Date.now() - startTime) / 1000,
      };
    }

    // Execute compiled Java class
    const { stdout, stderr } = await execAsync(`java -cp "${tempDir}" ${className}`, {
      timeout: TIMEOUT,
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    const executionTime = (Date.now() - startTime) / 1000;
    const output = (stdout + stderr).trim().slice(0, MAX_OUTPUT_LENGTH);

    return {
      status: 'success',
      output: output || '(No output)',
      executionTime,
    };
  } catch (error: any) {
    const executionTime = (Date.now() - startTime) / 1000;

    if (error.killed && error.signal === 'SIGTERM') {
      return {
        status: 'timeout',
        error: `Execution timeout (maximum ${TIMEOUT / 1000} seconds)`,
        executionTime,
      };
    }

    const errorOutput = (error.stdout || '') + (error.stderr || '');
    return {
      status: 'error',
      error: errorOutput.trim().slice(0, MAX_OUTPUT_LENGTH) || error.message,
      executionTime,
    };
  } finally {
    // Clean up temp directory
    try {
      await execAsync(`rm -rf "${tempDir}"`);
    } catch (e) {
      console.error('Failed to delete temp directory:', tempDir);
    }
  }
}

/**
 * Extract Java class name from code
 */
function extractJavaClassName(code: string): string | null {
  const match = code.match(/public\s+class\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Main code execution function
 */
export async function executeCode(language: string, code: string): Promise<ExecutionResult> {
  console.log(`[Code Execution] Executing ${language} code...`);

  try {
    let result: ExecutionResult;

    switch (language.toLowerCase()) {
      case 'javascript':
      case 'js':
        result = await executeJavaScript(code);
        break;
      case 'python':
      case 'py':
        result = await executePython(code);
        break;
      case 'java':
        result = await executeJava(code);
        break;
      default:
        result = {
          status: 'error',
          error: `Unsupported language: ${language}`,
        };
    }

    console.log(`[Code Execution] ${language} execution ${result.status} (${result.executionTime?.toFixed(3)}s)`);
    return result;
  } catch (error: any) {
    console.error('[Code Execution] Unexpected error:', error);
    return {
      status: 'error',
      error: `Unexpected error: ${error.message}`,
    };
  }
}

