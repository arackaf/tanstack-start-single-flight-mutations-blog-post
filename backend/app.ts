import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import bodyParser from "body-parser";
import { setup } from "./db-setup";
import { command, query } from "./db-utils";
import { Task } from "../types";

const jsonParser = bodyParser.json();

setup();

const app = express();

// Configure CORS
app.use(
  cors({
    origin: true, // Allow all origins in development
    credentials: true // Allow cookies to be sent
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(jsonParser);

app.get("/", function (_, res) {
  res.json({});
});

app.post("/api/epic/update", jsonParser, function (req, res) {
  const { id, name } = req.body;
  command(
    `
    UPDATE epics
    SET name = ?
    WHERE id = ?  
    `,
    [name, id]
  ).then(() => {
    res.json({ sucess: true });
  });
});

app.listen(3001);
