# System Architecture Diagrams

This document visualizes the core flows of Orbital to help maintainers and future agents understand the project logic quickly.

## ReAct Loop Flow

The ReAct (Reasoning + Acting) loop is the heart of Orbital.

```mermaid
graph TD
    User([User Input]) --> Loop[Start Loop]
    Loop --> LLM{Gemini AI}
    LLM --> Thought[Thought: Reasoning]
    Thought --> Choice{Action or Answer?}
    
    Choice -- Action --> Tool[Execute Tool]
    Tool --> Observation[Observation: Result]
    Observation --> Loop
    
    Choice -- Answer --> Final([Final Response to User])
    
    Loop -- Max Iterations? --> Final
```

## Tool Execution Flow

How Orbital interfaces with the local system.

```mermaid
graph LR
    Agent[agent.js] --> Registry[index.js: tool registry]
    Registry --> Terminal[tools/terminal.js]
    Registry --> Browser[tools/browser.js]
    
    Terminal --> Shell[Child Process / FS]
    Browser --> Playwright[Chromium Stealth]
    
    Shell --> Result[Observation]
    Playwright --> Result
    Result --> Agent
```

---

> [!TIP]
> When adding new tool categories, ensure you update this Tool Execution Flow diagram.
