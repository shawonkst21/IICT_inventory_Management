const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");

dotenv.config();

const { pool, testDatabaseConnection } = require("./config/db");
const systemRoutes = require("./routes/systemRoutes");
const authRoutes = require("./routes/authRoutes");
const itemRoutes = require("./routes/itemRoutes");
const itemRequestRoutes = require("./routes/itemRequestRoutes");
const itemReceiptRoutes = require("./routes/itemReceiptRoutes");
const { verifyToken, isAdminOrManager, isAuthenticated } = require("./middlewares/authMiddleware");

const PORT = Number.parseInt(process.env.PORT || "5000", 10);
const CLIENT_URL =
  process.env.NEXT_PUBLIC_CLIENT_URL || "http://localhost:3000";
const app = express();

function isAllowedClientOrigin(origin) {
  if (!origin) {
    return true;
  }

  if (origin === CLIENT_URL) {
    return true;
  }

  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

app.use(express.json());

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedClientOrigin(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use("/", systemRoutes);
app.use("/api/auth", authRoutes);
// Mount item routes without global admin middleware so public endpoints
// (like /options) are accessible to staff. Admin-only routes are protected
// inside the router under the /admin path.
app.use("/api/items", itemRoutes);
app.use("/api/item-requests", verifyToken, itemRequestRoutes);
app.use("/api/item-receipts", verifyToken, isAdminOrManager, itemReceiptRoutes);

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
