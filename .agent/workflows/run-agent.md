---
description: how to run the Embryo agent
---
# Running the Embryo Agent

This workflow describes how to start and interact with the Embryo AI agent.

1. Ensure environment variables are set up in `.env` (requires `GEMINI_API_KEY`).

2. Start the agent in interactive mode:
// turbo
```bash
npm start
```

3. Alternatively, run the agent with a specific task:
// turbo
```bash
npm start "your task description here"
```

4. If you encounter errors related to Playwright, ensure browsers are installed:
// turbo
```bash
npx playwright install chromium
```
