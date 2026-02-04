---
description: how to add a new tool to Orbital
---
# Adding a New Tool to Orbital

To expand Orbital's capabilities, follow these steps to add a new tool.

## 1. Create or Modify Tool File
If adding to an existing category, edit `src/tools/terminal.js` or `src/tools/browser.js`.
If creating a new category, create a new file in `src/tools/` (e.g., `src/tools/custom.js`).

Example tool function:
```javascript
export async function my_new_tool({ arg1 }) {
  // logic here
  return "result string for Observation";
}
```

## 2. Register the Tool
In `src/index.js`, import the new tool and add it to the `tools` object.

```javascript
import * as customTools from './tools/custom.js';
const tools = {
  ...terminalTools,
  ...browserTools,
  ...customTools // Add this
};
```

## 3. Update the System Prompt
In `src/agent.js`, add the new tool description and example to the `SYSTEM_PROMPT` constant.

```javascript
/* src/agent.js */
const SYSTEM_PROMPT = `
...
TOOLS:
...
N. my_new_tool({"arg1": "value"}): Description of what it does.
...
`;
```

## 4. Update Documentation
- Add the new tool to the [README](file:///Users/user/.gemini/antigravity/scratch/orbital/README.md).
- If you created a new tool file, update the tool execution flow in [DIAGRAMS.md](file:///Users/user/.gemini/antigravity/scratch/orbital/DIAGRAMS.md).

---

> [!IMPORTANT]
> Always return a string from tool functions, as this is passed directly back to the LLM as an Observation.
