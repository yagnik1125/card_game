import express from "express";
import cors from "cors";

import gameRoutes from "./routes/gameRoutes.js";
import { logger } from "./middleware/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { ALLOWED_CORS_ORIGINS } from "./config.js";

const app = express();

app.use(logger);

app.use(cors({ origin: ALLOWED_CORS_ORIGINS }));

app.use(express.json());

app.use("/api/games", gameRoutes);

app.use(errorHandler);

export default app;