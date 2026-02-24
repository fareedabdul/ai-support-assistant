const path = require("path");
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const db = require("./db");
const docs = require("./docs.json");
const Groq = require("groq-sdk");

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


app.post("/api/chat", async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !message) {
    return res.status(400).json({ error: "sessionId and message required" });
  }

  try {
    db.run(
      `INSERT OR IGNORE INTO sessions (id) VALUES (?)`,
      [sessionId]
    );

    db.run(
      `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
      [sessionId, "user", message]
    );

    const foundDoc = docs.find(doc =>
      message.toLowerCase().includes(doc.title.toLowerCase()) ||
      message.toLowerCase().includes(doc.content.toLowerCase())
    );

    let reply;
    if (foundDoc) {
      const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content:
              "You are a support assistant. Answer ONLY using the provided document content. Do not add extra information."
          },
          {
            role: "user",
            content: foundDoc.content
          }
        ],
        temperature: 0
      });

      reply = completion.choices[0].message.content;
    } else {
      reply = "Sorry, I don’t have information about that.";
    }

    db.run(
      `INSERT INTO messages (session_id, role, content) VALUES (?, ?, ?)`,
      [sessionId, "assistant", reply]
    );

    db.run(
      `UPDATE sessions SET updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [sessionId]
    );

    res.json({ reply });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.get("/api/conversations/:sessionId", (req, res) => {
  const { sessionId } = req.params;

  db.all(
    `SELECT role, content, created_at
     FROM messages
     WHERE session_id = ?
     ORDER BY created_at ASC`,
    [sessionId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.get("/api/sessions", (req, res) => {
  db.all(
    `SELECT id, updated_at
     FROM sessions
     ORDER BY updated_at DESC`,
    [],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

});
