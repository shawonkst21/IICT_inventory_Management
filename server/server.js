const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const { pool, testDatabaseConnection } = require("./config/db");
const systemRoutes = require("./routes/systemRoutes");
const itemRoutes = require("./routes/itemRoutes");
const itemRequestRoutes = require("./routes/itemRequestRoutes");
const itemReceiptRoutes = require("./routes/itemReceiptRoutes");

const PORT = Number.parseInt(process.env.PORT || "5000", 10);
const CLIENT_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";
const app = express();

app.use(express.json());

app.use(
  cors({
    origin: [CLIENT_URL, "http://localhost:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/", systemRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/item-requests", itemRequestRoutes);
app.use("/api/item-receipts", itemReceiptRoutes);

async function startServer() {
  try {
    const dbTime = await testDatabaseConnection();
    console.log("PostgreSQL connected:", dbTime);

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to connect PostgreSQL:", error.message);
    process.exit(1);
  }
}

startServer();
module.exports = { app, pool };
