import express, { Express, Request, Response, Application } from "express";
import dotenv from "dotenv";
import path from "path";
import cors from "cors";
//For env File
dotenv.config();

const _dirname = path.dirname("");

const app: Application = express();
app.use(cors());
const port = process.env.PORT || 8000;

app.get("/", (req: Request, res: Response) => {
  res.send("Welcome to Express & TypeScript Server");
});

app.listen(port, () => {
  console.log(`Server is Fire at http://localhost:${port}`);
});
