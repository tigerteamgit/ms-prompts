import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

console.log("AI SERVICE (PRO + DASHBOARD + PROMPT TUNING)");

const app = express();
app.use(express.json());

/* =========================
   ANALYTICS STORE
========================= */

const analyticsStore = {
  runs: []
};

/* =========================
   CONFIG
========================= */

const endpoint =
  process.env.AZURE_OPENAI_ENDPOINT ||
  "https://ms-prompt-resource.openai.azure.com";

const deployment = process.env.AZURE_OPENAI_DEPLOYMENT;

console.log("🔧 CONFIG:", {
  endpoint,
  deployment,
  hasKey: !!process.env.AZURE_OPENAI_API_KEY
});

/* =========================
   CLIENT
========================= */

const client = new OpenAI({
  apiKey: process.env.AZURE_OPENAI_API_KEY,
  baseURL: `${endpoint}/openai/deployments/${deployment}`,
  defaultQuery: {
    "api-version": "2024-02-15-preview"
  },
  defaultHeaders: {
    "api-key": process.env.AZURE_OPENAI_API_KEY
  }
});

/* =========================
   STORAGE
========================= */

const analytics = [];
const feedbackStore = [];
const promptMetrics = [];

/* =========================
   PROMPT LIBRARY
========================= */

const promptLibrary = [
  {
    id: 1,
    name: "support",
    version: "v1",
    prompt:
      "You are a concise enterprise support agent.",
    fewShot: false,
    examples: []
  }
];

/* =========================
   PROMPT TEMPLATES
========================= */

const templates = {
  hello: {
    v1: () => [
      {
        role: "system",
        content: "You are a helpful assistant. Keep responses short."
      },
      {
        role: "user",
        content: "Say hello from Azure Foundry."
      }
    ]
  },

  support: {
    v1: ({ user, issue }) => [
      {
        role: "system",
        content: "You are a concise enterprise support agent."
      },
      {
        role: "user",
        content: `User: ${user}\nIssue: ${issue}`
      }
    ]
  }
};

/* =========================
   ANALYTICS LOGGER
========================= */

function logAnalytics(entry) {
  const enriched = {
    ...entry,
    timestamp: new Date().toISOString()
  };

  analytics.push(enriched);

  console.log("LOG:", {
    route: enriched.route,
    latencyMs: enriched.latencyMs,
    prompt: enriched.prompt,
    version: enriched.version
  });

  // ALSO TRACK PROMPT METRICS
  promptMetrics.push({
    prompt: enriched.prompt,
    version: enriched.version,
    route: enriched.route,
    latencyMs: enriched.latencyMs,
    success: true,
    feedback: null,
    score: null,
    timestamp: enriched.timestamp
  });
}

/* =========================
   PROMPT SCORING ENGINE
========================= */

function scorePrompt({ success, latencyMs, feedback }) {
  let score = 0;

  if (success) score += 50;
  else score -= 50;

  if (latencyMs < 1000) score += 20;
  else if (latencyMs > 2500) score -= 10;

  if (feedback === "up") score += 30;
  if (feedback === "down") score -= 30;

  return score;
}

/* =========================
   BEST PROMPT PICKER
========================= */

function getBestPrompt(promptName) {
  const items = promptMetrics.filter(p => p.prompt === promptName);

  if (!items.length) return "v1";

  const best = items.reduce((a, b) =>
    (b.score || 0) > (a.score || 0) ? b : a
  );

  return best.version || "v1";
}

/* =========================
   HEALTH
========================= */

app.get("/", (req, res) => {
  res.send("AI service running");
});

/* =========================
   HELLO
========================= */

app.get("/hello", async (req, res) => {
  const start = Date.now();

  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: [
        {
          role: "system",
          content:
            "You are a live AI model running inside a server. Always respond with reasoning steps and a unique, non-repetitive answer."
        },
        {
          role: "user",
          content:
            "Pick a random number between 1 and 1,000,000, explain how you chose it, and then multiply it by 17. Show the final result clearly."
        }
      ],
      temperature: 1.0
    });

    const content = response.choices?.[0]?.message?.content;

    const latency = Date.now() - start;

    console.log("\n===== FOUNDRY LIVE OUTPUT =====\n");
    console.log(content);
    console.log("\n==================================\n");

    console.log("Latency:", latency + "ms");

    res.json({
      content,
      latency
    });

  } catch (err) {
    console.log("/hello error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   🛠 SUPPORT
========================= */

app.get("/support", async (req, res) => {


  const start = Date.now();

  const { user = "anonymous", issue = "not specified" } = req.query;

  const version = getBestPrompt("support"); // TUNING ACTIVE

  try {
    const response = await client.chat.completions.create({
      model: deployment,
      messages: templates.support[version]({ user, issue })
    });

    const latency = Date.now() - start;

    logAnalytics({
      route: "/support",
      latencyMs: latency,
      prompt: "support",
      version,
      model: deployment
    });

    res.json(response.choices?.[0]?.message);

  } catch (err) {
    console.log("/support error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   FEEDBACK SYSTEM (ENHANCED)
========================= */

app.post("/feedback", (req, res) => {
  const { route, rating, prompt, version } = req.body;

  const entry = {
    route,
    rating,
    prompt,
    version,
    timestamp: new Date().toISOString()
  };

  feedbackStore.push(entry);

  // attach feedback to prompt metrics
  const match = promptMetrics.find(
    p => p.prompt === prompt && p.version === version
  );

  if (match) {
    match.feedback = rating;
    match.score = scorePrompt({
      success: match.success,
      latencyMs: match.latencyMs,
      feedback: rating
    });
  }

  console.log("FEEDBACK:", entry);

  res.json({ status: "stored", entry });
});

/* =========================
   PROMPT WORKBENCH TEST
========================= */

app.get("/workbench/test", async (req, res) => {
  const response = await client.chat.completions.create({
    model: deployment,
    messages: [
      { role: "user", content: "Say hello in one sentence" }
    ]
  });

  console.log(response.choices?.[0]?.message?.content);

  res.send(response.choices?.[0]?.message?.content);
});

/* =========================
   PROMPT WORKBENCH BACKEND EXECUTE
========================= */

app.post("/workbench/run", async (req, res) => {

  console.log("POST /workbench/run hit");
  console.log("BODY:", req.body);

  const start = Date.now();

  const {
    role = "",
    task = "",
    context = "",
    example = ""
  } = req.body?.promptText || {};

  if (!role || !task) {
    return res.status(400).json({
      error: "Missing role or task"
    });
  }

  try {

    const response = await client.chat.completions.create({
      model: deployment,

      messages: [
        {
          role: "system",
          content: `You are: ${role}. Use context: ${context}. Example: ${example}`
        },
        {
          role: "user",
          content: task
        }
      ],

      temperature: 0.7
    });

    const content = response.choices?.[0]?.message?.content || "";

    const latency = Date.now() - start;

    console.log("\n===== WORKBENCH OUTPUT =====\n");
    console.log(content);
    console.log("\n===========================\n");

    /* ---- ANALYTICS HOOK ---- */
    analyticsStore.runs.push({
      role,
      task,
      context,
      example,
      response: content,
      latency_ms: latency,
      model: deployment,
      timestamp: new Date().toISOString()
    });

    console.log("analytics push:", analyticsStore.runs.length);

    res.json({
      full: content,
      latency
    });

  } catch (err) {
    console.log("ERROR:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* =========================
   PROMPT LIBRARY
========================= */

app.get("/prompts", (req, res) => {
  res.json(promptLibrary);
});

/* =========================
   PROMPT WORKBENCH
========================= */

app.get("/workbench", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<style>

body {
  font-family: Arial;
  background: #0b0f17;
  color: white;
  padding: 20px;
}

h1, h2 {
  color: #cfe9ff;
}

input, select {
  background: #121a2a;
  color: white;
  border: 1px solid #2a3550;
  padding: 8px;
  border-radius: 4px;
  width: 300px;
}

button {
  background: #1b2740;
  color: white;
  border: 1px solid #2a3550;
  padding: 10px 14px;
  border-radius: 6px;
  cursor: pointer;
  margin-right: 8px;
}

button:hover {
  background: #263554;
}

#output, #comparison {
  background: #121a2a;
  border: 1px solid #2a3550;
  padding: 12px;
  margin-top: 10px;
  border-radius: 6px;
}

pre {
  white-space: pre-wrap;
}

.prompt-row {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  overflow-x: auto;
  align-items: flex-end;
}

.prompt-row input {
  width: 120px;
}

.prompt-field {
  display: flex;
  flex-direction: column;
}

.prompt-field label {
  font-size: 12px;
}

</style>
</head>

<body>

<html>
  <body>

    <h1>Prompt Workbench</h1>

    <!-- =========================
         TEMPLATE DROPDOWN
    ========================== -->
    <label>Template</label><br>
    <select id="template" onchange="applyTemplate()">
      <option value="hello">Assistant</option>
      <option value="support">Support Agent</option>
    </select>

    <br><br>

    <div style="
      display:flex;
      gap:8px;
      flex-wrap:nowrap;
      overflow-x:auto;
      margin-bottom:20px;
      align-items:flex-end;
    ">

      <div style="display:flex; flex-direction:column;">
        <label style="font-size:12px;">Role</label>
        <input id="role" placeholder="Role" style="width:300px;" />
      </div>

      <div style="display:flex; flex-direction:column;">
        <label style="font-size:12px;">Format</label>
        <input id="format" placeholder="Format" style="width:120px;" />
      </div>

      <div style="display:flex; flex-direction:column;">
        <label style="font-size:12px;">Reference</label>
        <input id="reference" placeholder="Reference" style="width:120px;" />
      </div>

      <div style="display:flex; flex-direction:column;">
        <label style="font-size:12px;">Request</label>
        <input id="request" placeholder="Request" style="width:120px;" />
      </div>

      <div style="display:flex; flex-direction:column;">
        <label style="font-size:12px;">Framing</label>
        <input id="framing" placeholder="Framing" style="width:120px;" />
      </div>

    </div>


    <label>Task</label><br>
    <input id="task" placeholder="Task" />
    <br><br>

    <label>Context</label><br>
    <input id="context" placeholder="Context" />
    <br><br>

    <label>Max Tokens</label><br>
    <input id="maxTokens" placeholder="Max Tokens" />
    <br><br>

    <label>Example</label><br>
    <input id="example" placeholder="Example" />
    <br><br>

    <button onclick="runPrompt()">Run Prompt</button>
    <button onclick="compareRuns()">Compare Last Two</button>

    <hr>

    <h2>Comparison</h2>
    <div id="comparison">No comparisons yet...</div>

    <hr>

    <h2>Runs</h2>
    <div id="output">Output will appear here...</div>

    <script>

      console.log("Workbench loaded");

      const runs = [];

      /* =========================
         TEMPLATE MAP
      ========================== */
      const templateMap = {
        hello: "You are a helpful assistant",
        support: "You are a concise enterprise support agent"
      };

      function applyTemplate() {

        const selected =
          document.getElementById("template").value;

        document.getElementById("role").value =
          templateMap[selected] || "";

      }

      const defaultPrompt = {
        role: "You are a helpful assistant",
        task: "What do you do?"
      };

      window.onload = function () {

        document.getElementById("role").value =
          defaultPrompt.role;

        document.getElementById("task").value =
          defaultPrompt.task;

        document.getElementById("template").value =
          "hello";

        applyTemplate();

      };

      async function runPrompt() {

        console.log("clicked");

        const payload = {
          promptText: {
            role:
              document.getElementById("role").value,

            task:
              document.getElementById("task").value,

            context:
              document.getElementById("context").value,

            maxTokens:
              document.getElementById("maxTokens").value,

            example:
              document.getElementById("example").value
          }
        };

        console.log("sending:", payload);

        const res =
          await fetch("/workbench/run", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
          });

        const data = await res.json();

        const run = {
          role: payload.promptText.role,
          task: payload.promptText.task,
          response: data.full || data.error,
          timestamp: new Date().toLocaleString()
        };

        runs.push(run);

        document.getElementById("output").innerHTML +=
          "<div style='border:1px solid #ccc;padding:10px;margin:10px 0;'>" +
          "<h3>" + run.role + "</h3>" +
          "<b>Task:</b> " + run.task + "<br>" +
          "<b>Time:</b> " + run.timestamp + "<hr>" +
          "<pre style='white-space:pre-wrap;'>" + run.response + "</pre>" +
          "</div>";

      }

      function compareRuns() {

        if (runs.length < 2) {
          alert("Need at least two runs");
          return;
        }

        const a =
          runs[runs.length - 2];

        const b =
          runs[runs.length - 1];

        const wordsA =
          a.response.split(/\s+/).filter(Boolean).length;

        const wordsB =
          b.response.split(/\s+/).filter(Boolean).length;

        const diff =
          wordsB - wordsA;

        document.getElementById("comparison").innerHTML =
          "<h3>" + a.role + " vs " + b.role + "</h3>" +
          "<p>" + a.role + ": " + wordsA + " words</p>" +
          "<p>" + b.role + ": " + wordsB + " words</p>" +
          "<p><b>Difference:</b> " + diff + "</p>";

      }

    </script>

  </body>
</html>
  `);
});

/* =========================
   DASHBOARD UI
========================= */

app.get("/analytics", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
<style>
body {
  font-family: Arial;
  padding: 20px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  border: 1px solid #ccc;
  padding: 8px;
}
</style>
</head>

<body>

<h1>📊 AI Observability Dashboard</h1>

<!-- ===================== PROMPT TABLE ===================== -->
<h2>Prompt Analytics</h2>
<table id="promptTable"></table>

<!-- ===================== MODEL TABLE ===================== -->
<h2>Model Analytics</h2>
<table id="modelTable"></table>

<script>

/* =========================
   PROMPT DATA (TUNING LAYER)
========================= */

const promptData = [
  {
    prompt: "assistant",
    prompt_token_usage: 100,
    response_token_usage: 80,
    change: "remove filler text",
    version: "v1",
    score: 82
  },
  {
    prompt: "support_agent",
    prompt_token_usage: 200,
    response_token_usage: 400,
    change: "tighten instructions",
    version: "v1",
    score: 76
  }
];

/* =========================
   MODEL DATA (OPS LAYER)
========================= */

const modelData = [
  {
    model: "gpt-4.1-mini",
    requests: 15,
    avg_latency_ms: 920,
    success_rate: "99%",
    avg_prompt_tokens: 150,
    avg_response_tokens: 120,
    avg_total_tokens: 270
  },
  {
    model: "gpt-4o",
    requests: 5,
    avg_latency_ms: 1200,
    success_rate: "100%",
    avg_prompt_tokens: 220,
    avg_response_tokens: 180,
    avg_total_tokens: 400
  }
];

/* =========================
   TABLE RENDERER
========================= */

function renderTable(id, rows, columns) {
  const table = document.getElementById(id);

  if (!rows || rows.length === 0) {
    table.innerHTML = "<tr><td>No data</td></tr>";
    return;
  }

  let html = "";

  /* HEADER */
  html += "<tr>";
  for (const col of columns) {
    html += "<th>" + col + "</th>";
  }
  html += "</tr>";

  /* ROWS */
  for (const row of rows) {
    html += "<tr>";

    for (const col of columns) {
      html += "<td>" + (row[col] ?? "") + "</td>";
    }

    html += "</tr>";
  }

  table.innerHTML = html;
}

/* =========================
   RENDER TABLES
========================= */

renderTable(
  "promptTable",
  promptData,
  [
    "prompt",
    "change",
    "version",
    "score",
    "prompt_token_usage",
    "response_token_usage"
  ]
);

renderTable(
  "modelTable",
  modelData,
  [
    "model",
    "requests",
    "avg_latency_ms",
    "success_rate",
    "avg_prompt_tokens",
    "avg_response_tokens",
    "avg_total_tokens"
  ]
);

</script>

<style>

body {
  font-family: Arial;
  background: #0b0f17;
  color: white;
  padding: 20px;
}

h1 {
  margin-bottom: 10px;
}

h2 {
  margin-top: 30px;
  color: #cfe9ff;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  background: #121a2a;
}

th, td {
  border: 1px solid #2a3550;
  padding: 10px;
  font-size: 13px;
}

th {
  background: #1b2740;
  text-align: left;
}

</style>

</script>

</body>
</html>
  `);
});



/* =========================
   SERVER
========================= */

app.listen(3000, () => {
  console.log("http://localhost:3000");
  console.log("/hello");
  console.log("/support");
  console.log("/analytics");
  console.log("/prompts/rankings");
  console.log("/workbench");
  console.log("/workbench/run");
});