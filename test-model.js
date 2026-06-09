import "dotenv/config";
import { AzureOpenAI } from "openai";

// ---- CONFIG ----
const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
const apiKey = process.env.AZURE_OPENAI_API_KEY;
const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

// ---- CLIENT ----
const client = new AzureOpenAI({
  endpoint,
  apiKey,
  apiVersion: "2024-02-15-preview"
});

// ---- TEST PROMPT ----
const prompt = "Say hello in 3 different ways and keep it short.";

async function run() {
  try {
    console.log("Sending request to model...");

    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const output = response.choices?.[0]?.message?.content;

    console.log("\n===== MODEL OUTPUT =====\n");
    console.log(output);
    console.log("\n========================\n");

  } catch (err) {
    console.error("ERROR CALLING MODEL:");
    console.error(err);
  }
}

run();