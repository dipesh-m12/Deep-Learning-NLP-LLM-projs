const express = require("express");
require("dotenv").config();
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const port = process.env.PORT || 3000;
const client = require("prom-client");
const responseTime = require("response-time");

const { createLogger, transports } = require("winston");
const LokiTransport = require("winston-loki");
const options = {
  transports: [
    new LokiTransport({
      labels: { appName: "express" },
      host: "http://127.0.0.1:3100",
    }),
  ],
};
const logger = createLogger(options);

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ register: client.register });

const reqResTime = new client.Histogram({
  name: "http_express_req_res_time",
  help: "This tells how much time is taken by req and res",
  labelNames: ["method", "route", "status_code"],
  buckets: [1, 50, 100, 200, 400, 500, 800, 1000, 2000],
});

const totalReqCounter = new client.Counter({
  name: "total_req",
  help: "Tells total req",
});

const app = express();

app.use(
  responseTime((req, res, time) => {
    totalReqCounter.inc();
    reqResTime
      .labels({
        method: req.method,
        route: req.url,
        status_code: res.statusCode,
      })
      .observe(time);
  })
);

app.use(express.json());
app.use(cors());

const uploadDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname); // Extract the original file extension
    cb(null, file.fieldname + "-" + uniqueSuffix + ext); // Use the original extension
  },
});

const upload = multer({ storage: storage });

app.get("/", (req, res) => {
  logger.info("Logged Message");
  res.send("Hello from Index.js");
});

app.get("/metrics", async (req, res) => {
  res.setHeader("Content-Type", client.register.contentType);
  const metrics = await client.register.metrics();
  res.send(metrics);
});

app.post("/classify-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    console.log("File uploaded:", req.file);

    const filePath = req.file.path;

    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      "http://localhost:5001/classify-image",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    fs.unlinkSync(filePath); // Clean up the temp file
    res.json(response.data);
  } catch (error) {
    console.error("Error communicating with Python API:", error);
    res.status(500).json({ error: "Error communicating with Python API" });
  }
});

app.post("/detect-mood", async (req, res) => {
  const { text } = req.body;
  try {
    const response = await axios.post("http://localhost:5001/detect-mood", {
      text,
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error communicating with Python API" });
  }
});

app.post("/summarize-text", async (req, res) => {
  const { text } = req.body;
  try {
    const response = await axios.post("http://localhost:5001/summarize-text", {
      text,
    });
    res.json(response.data);
  } catch (error) {
    res
      .status(500)
      .json({ error: "Error communicating with the summarization API" });
  }
});

app.post("/explain-image", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      "http://localhost:5001/explain-image",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    fs.unlinkSync(filePath); // Clean up the temp file
    res.json(response.data);
  } catch (error) {
    console.error("Error communicating with Python API:", error);
    res.status(500).json({ error: "Error communicating with Python API" });
  }
});

app.post("/analyze-camera-feed", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      console.error("No file uploaded");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const filePath = req.file.path;
    const formData = new FormData();
    formData.append("file", fs.createReadStream(filePath));

    const response = await axios.post(
      "http://localhost:5001/analyze-camera-feed",
      formData,
      {
        headers: formData.getHeaders(),
      }
    );

    fs.unlinkSync(filePath); // Clean up the temp file
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Error communicating with Python API" });
  }
});

app.listen(port, () => {
  console.log(`Server started on ${port}`);
});
