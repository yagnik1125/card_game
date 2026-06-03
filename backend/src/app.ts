import express from "express";
import cors from "cors";

import gameRoutes from "./routes/gameRoutes";
import { logger } from "./middleware/logger";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

app.use(logger);

app.use(cors());

app.use(express.json());

app.use("/api/games", gameRoutes);

app.use(errorHandler);

export default app;