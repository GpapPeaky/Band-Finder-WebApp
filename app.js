const express = require("express");
const path = require("path");

const app = express();
const PORT = 3000;

// Parse JSON request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.use((req, res, next) => {
  console.log("---- INCOMING REQUEST ----");
  console.log("METHOD:", req.method);
  console.log("URL:", req.originalUrl);
  console.log("QUERY:", req.query);
  console.log("BODY:", req.body);
  console.log("--------------------------");
  next();
});
app.use(
  "/db",
  (req, res, next) => {
    console.log("→ Routed to /db");
    next();
  },
  require("./routes/db")
);

app.use(
  "/admin",
  (req, res, next) => {
    console.log("→ Routed to /admin");
    next();
  },
  require("./routes/admin")
);

app.use(
  "/user",
  (req, res, next) => {
    console.log("→ Routed to /user");
    next();
  },
  require("./routes/user")
);

app.use(
  "/band",
  (req, res, next) => {
    console.log("→ Routed to /band");
    next();
  },
  require("./routes/band")
);
app.use(
  "/general",
  (req, res, next) => {
    console.log("→ Routed to /general");
    next();
  },
  require("./routes/general")
);

app.use(
  "/llm",
  (req, res, next) => {
    console.log("→ Routed to /llm");
    next();
  },
  require("./routes/llm")
);
app.listen(PORT, () => {
  console.log(`Server open at: http://localhost:${PORT}`);
});

// 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