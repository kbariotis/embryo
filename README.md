# Embryo 🚀

Embryo is an autonomous local AI agent designed to interact with your computer. It uses a ReAct loop to reason about tasks and execute them using terminal and browser tools.

## Architecture 🏗️

Embryo is built with Node.js and integrates with Google's Gemini models.

- **ReAct Loop (`src/agent.js`)**: The core engine that handles the Thought-Action-Observation cycle.
- **LLM Integration (`src/llm.js`)**: Simple wrapper for Gemini API calls.
- **Tools (`src/tools/`)**:
  - `terminal.js`: Shell command execution, file management.
  - `browser.js`: Playwright-based browser automation with stealth.

## Getting Started 🛠️

### Prerequisites
- Node.js installed.
- A Gemini API Key from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation
1. Clone the repository (or navigate to the project folder).
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`.
   - Add your `GEMINI_API_KEY`.

### Running Embryo
```bash
npm start
```
Or with a direct task:
```bash
npm start "Analyze the files in the current directory"
```

## Maintenance for Coding Agents 🤖

> [!IMPORTANT]
> To ensure Embryo remains easy to onboard for future agents, always update the following when making changes:
> - **Tool Changes**: If you add, remove, or modify a tool's signature, update the `SYSTEM_PROMPT` in `src/agent.js` and this README.
> - **Logic Changes**: If you change the ReAct loop or core flow, update `DIAGRAMS.md`.
> - **New Tools**: Use the [add-tool workflow](.agent/workflows/add-tool.md) to ensure consistency.

---

*Embryo - Expanding your reach through autonomous local action.*
