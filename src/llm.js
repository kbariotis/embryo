import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { Ollama } from "ollama";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

/**
 * Detect the LLM provider based on environment variables
 */
function getProvider() {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic';
  if (process.env.OPENAI_API_KEY) return 'openai';
  if (process.env.OLLAMA_MODEL) return 'ollama';
  if (process.env.GEMINI_API_KEY) return 'gemini';
  return null;
}

const provider = getProvider();

if (!provider) {
  console.error(chalk.red("\n[Error] No LLM provider configuration detected."));
  console.error(chalk.yellow("Please update your .env file with at least one API key (GEMINI_API_KEY, ANTHROPIC_API_KEY, or OPENAI_API_KEY) or OLLAMA_MODEL.\n"));
  process.exit(1);
}

// Initialize Clients
const clients = {
  gemini: process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null,
  anthropic: process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null,
  openai: process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null,
  ollama: new Ollama({ host: process.env.OLLAMA_HOST || 'http://localhost:11434' })
};

export async function chat(contents, systemInstruction) {
  try {
    switch (provider) {
      case 'gemini':
        return await chatGemini(contents, systemInstruction);
      case 'anthropic':
        return await chatAnthropic(contents, systemInstruction);
      case 'openai':
        return await chatOpenAI(contents, systemInstruction);
      case 'ollama':
        return await chatOllama(contents, systemInstruction);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    return `Error calling ${provider}: ${error.message}`;
  }
}

async function chatGemini(contents, systemInstruction) {
  const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash-lite";
  const model = clients.gemini.getGenerativeModel({ model: modelName });
  const result = await model.generateContent({
    contents: Array.isArray(contents) ? contents : [{ role: 'user', parts: [{ text: contents }] }],
    systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
  });
  const response = await result.response;
  return response.text();
}

async function chatAnthropic(contents, systemInstruction) {
  const modelName = process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest";
  const messages = Array.isArray(contents) 
    ? contents.map(c => ({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text }))
    : [{ role: 'user', content: contents }];

  const response = await clients.anthropic.messages.create({
    model: modelName,
    max_tokens: 4096,
    system: systemInstruction,
    messages: messages,
  });
  return response.content[0].text;
}

async function chatOpenAI(contents, systemInstruction) {
  const modelName = process.env.OPENAI_MODEL || "gpt-4o";
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  
  if (Array.isArray(contents)) {
    contents.forEach(c => {
      messages.push({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text });
    });
  } else {
    messages.push({ role: 'user', content: contents });
  }

  const response = await clients.openai.chat.completions.create({
    model: modelName,
    messages: messages,
  });
  return response.choices[0].message.content;
}

async function chatOllama(contents, systemInstruction) {
  const modelName = process.env.OLLAMA_MODEL;
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: 'system', content: systemInstruction });
  }
  
  if (Array.isArray(contents)) {
    contents.forEach(c => {
      messages.push({ role: c.role === 'model' ? 'assistant' : 'user', content: c.parts[0].text });
    });
  } else {
    messages.push({ role: 'user', content: contents });
  }

  const response = await clients.ollama.chat({
    model: modelName,
    messages: messages,
  });
  return response.message.content;
}
