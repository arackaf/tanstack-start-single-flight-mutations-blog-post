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

app.get("/api/tasks/overview", function (_, res) {
  console.log("in tasks overview");
  query(`
    SELECT u.name user, count(*) count
    FROM tasks t
    INNER JOIN users u
    ON t.userId = u.id
    GROUP BY u.id
  `).then(tasks => {
    console.log("tasks", tasks);
    res.json(tasks);
  });
});

app.post("/api/task/update", jsonParser, function (req, res) {
  const { id, title } = req.body;
  command(
    `
    UPDATE tasks
    SET title = ?
    WHERE id = ?  
    `,
    [title, id]
  ).then(() => {
    res.json({ sucess: true });
  });
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

app.get("/api/epics/:id/milestones", async function (req, res) {
  query<Task[]>(
    `
    SELECT * 
    FROM milestones
    WHERE epicId = ?
    ORDER BY id ASC
  `,
    [parseInt(req.params.id)]
  ).then((milestones: any) => {
    res.json(milestones);
  });
});

app.listen(3001);
