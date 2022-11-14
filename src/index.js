import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from "dotenv";
import Joi from "joi";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batePapoUol");
});

app.post("/participants", (req, res) => {});

app.get("/participantes", (req, res) => {});

app.post("/messages", (req, res) => {});

app.get("/messages", (req, res) => {});

app.post("/status", (req, res) => {});

app.listen(5000, () => {
  console.log("Server running in port 5000");
});
