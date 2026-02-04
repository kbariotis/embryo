import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import chalk from "chalk";

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey || apiKey === "your_api_key_here" || apiKey === "GEMINI_KEY_GOES_HERE") {
  console.error(chalk.red("\n[Error] Invalid API Key detected."));
  console.error(chalk.yellow("Please update your .env file with a valid Gemini API key from https://aistudio.google.com/app/apikey\n"));
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);
const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
const model = genAI.getGenerativeModel({ model: modelName });

export async function chat(contents, systemInstruction) {
  try {
    const result = await model.generateContent({
      contents: Array.isArray(contents) ? contents : [{ role: 'user', parts: [{ text: contents }] }],
      systemInstruction: systemInstruction ? { role: 'system', parts: [{ text: systemInstruction }] } : undefined,
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    return `Error calling Gemini: ${error.message}`;
  }
}
