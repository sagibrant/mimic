import * as fs from 'fs';
import * as path from 'path';
import { Step, Task, TaskAsset, TaskGroup } from './Task';

// Configuration - Output to the SAME directory as build-asset.ts
const FLAG = '/** script flag **/';
const ROOT_DIR = new URL('.', import.meta.url).pathname;  // Directory of build-asset.ts (/test/sdk/)
const OUTPUT_FILE = 'asset.mimic';  // Output directly here: /test/sdk/asset.mimic
const IGNORE_DIRS = ['dist', 'node_modules'];

// Get all subdirectories in the current directory
function getSubdirectories(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(item => fs.statSync(path.join(dir, item)).isDirectory())
    .map(item => path.join(dir, item));
}

// Get all JS files in a directory
function getJsFiles(dir: string): string[] {
  return fs.readdirSync(dir)
    .filter(item => item.endsWith('.js') && fs.statSync(path.join(dir, item)).isFile())
    .map(item => path.join(dir, item));
}
function generateUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `uid-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

// Main function
function buildAssets() {
  try {
    const root: TaskGroup = {
      id: 'root',
      name: 'root',
      type: 'group',
      children: []
    };

    const asset: TaskAsset = {
      id: generateUUID(),
      name: 'demo',
      type: 'asset',
      url: '',
      author: 'sagi',
      description: 'this is the sdk testing task asset',
      version: '0.0.1',
      tags: ['demo'],
      root: root,
      results: [],
      creation_time: Date.now(),
      last_modified_time: Date.now(),
    };

    // add empty group 
    const group_no_task: TaskGroup = {
      id: generateUUID(),
      name: 'no tasks',
      type: 'group',
      children: []
    };
    root.children.push(group_no_task);

    // add empty task group
    const group_no_steps: TaskGroup = {
      id: generateUUID(),
      name: 'no steps',
      type: 'group',
      children: []
    };
    const task_no_steps: Task = {
      id: generateUUID(),
      name: 'no steps ',
      type: 'task',
      steps: []
    };
    group_no_steps.children.push(task_no_steps);
    root.children.push(group_no_steps);

    const groupFolders = getSubdirectories(ROOT_DIR);
    for (const groupDir of groupFolders) {
      const dirName = path.basename(groupDir);
      if (IGNORE_DIRS.includes(dirName)) {
        continue;
      }

      const task_group: TaskGroup = {
        id: generateUUID(),
        name: dirName,
        type: 'group',
        children: []
      };
      const taskFolders = getSubdirectories(groupDir);
      for (const taskDir of taskFolders) {
        const dirName = path.basename(taskDir);
        const jsFiles = getJsFiles(taskDir);

        if (jsFiles.length === 0) {
          console.log(`No JS files found in ${dirName}`);
          continue;
        }

        const task: Task = {
          id: generateUUID(),
          name: dirName,
          type: 'task',
          steps: []
        };

        // Add the task to the tasks array
        task_group.children.push(task);
        console.log(`+ group[${task_group.name}].task[${task.name}] <== folder[${dirName}]`);

        for (const file of jsFiles) {
          const fileName = path.basename(file, '.js');
          let content: string = '';
          let description: string | null = null; // To store the extracted description
          try {
            content = fs.readFileSync(file, 'utf8');
            // Step 1: Extract the JSDoc block (/** ... */) if it exists
            // Regex explanation:
            // /\/\*\*    : Match the start of a JSDoc block (/**)
            // (.*?)      : Non-greedy capture of all content inside the block
            // \*\//      : Match the end of the JSDoc block (*/)
            // s flag     : Make . match newlines (so multi-line blocks are captured)
            const jsdocMatch = content.match(/\/\*\*(.*?)\*\//s);

            if (jsdocMatch) {
              const jsdocContent = jsdocMatch[1]; // Extract content inside the JSDoc block

              // Step 2: Split JSDoc content into lines (handle all line endings)
              const jsdocLines = jsdocContent.split(/\r?\n/);

              // Step 3: Regex to match @description tag with flexible formatting
              // Explanation:
              // ^\s*\*?\s* : Allow leading whitespace, optional *, and more whitespace (handles lines like " * @description")
              // @description : Match the literal tag
              // \s*:\s*    : Allow any number of spaces/tabs around the colon
              // (.*)       : Capture the description text (everything after the colon)
              const descriptionRegex = /^\s*\*?\s*@description\s*:*\s*(.*)$/i;

              // Step 4: Check each line in the JSDoc block for the tag
              for (const line of jsdocLines) {
                const trimmedLine = line.trim(); // Clean up whitespace
                const match = trimmedLine.match(descriptionRegex);

                if (match) {
                  // Extract and clean the description (trim extra spaces)
                  description = match[1].trim();
                  break; // Stop at the first @description found
                }
              }
            }

            // Log results
            if (description) {
              // console.log(`Extracted description from ${fileName}: "${description}"`);
            } else {
              // console.log(`No @description found in JSDoc for ${fileName}`);
              description = fileName;
            }

          } catch (err) {
            console.error('Error reading file:', file, err);
            continue;
          }

          // Extract content after flag (or use full content if flag missing)
          const flagIndex = content.indexOf(FLAG);
          if (flagIndex !== -1) {
            content = content.slice(flagIndex + FLAG.length).trim();
          } else {
            // console.warn(`Flag not found in ${file} - using full content`);
          }

          const step: Step = {
            uid: generateUUID(),
            type: 'script_step',
            description: description,
            script: content
          };

          task.steps.push(step);
          console.log(`+ group[${task_group.name}].task[${task.name}].step[${description}] <== file[${fileName}]`);
        }

        task.steps.sort((a, b) => {
          return a.description.localeCompare(b.description);
        });
      }

      root.children.push(task_group);
    }

    // Output path: same directory as build-asset.ts
    const outputPath = path.join(ROOT_DIR, OUTPUT_FILE);
    fs.writeFileSync(outputPath, JSON.stringify(asset, null, 2), 'utf8');
    console.log(`Successfully created: ${outputPath}`);

  } catch (err) {
    console.error('Build failed:', err);
    process.exit(1);
  }
}

// Run the build
buildAssets();
