import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from "dotenv";
import joi from "joi";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

const time = dayjs().format("HH/MM/SS");

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batePapoUol");
});

const nameSchema = joi.object({ name: joi.string().min(1).required() });

const messageSchema = joi.object({
  to: joi.string().min(1).required(),
  text: joi.string().min(1).required(),
  type: joi.string().valid("message", "private_message").required(),
});

app.post("/participants", async (req, res) => {
  const participante = req.body;
  const validation = nameSchema.validate(participante, {
    abortEarly: false,
  });
  if (validation.error) {
    const errors = validation.error.details.map((d) => d.message);
    res.status(422).send(errors);
    return;
  }

  try {
    const nameExists = await db
      .collection("participants")
      .findOne({ name: participante.name });
    if (nameExists) {
      res.status(409).send({ message: "Esse nome já está cadastrado" });
      return;
    }
    await db
      .collection("participants")
      .insertOne({ name: participante.name, lastStatus: Date.now() });
    await db.collection("message").insertOne({
      from: participante.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: time,
    });
    res.sendStatus(201);
  } catch (err) {
    console.log(err);
  }
});

app.get("/participantes", async (req, res) => {
  try {
    const participants = await db.collection("participants").find().toArray();
    if (!participants) {
      res.status(500);
      return;
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/messages", (req, res) => {});

app.get("/messages", (req, res) => {});

app.post("/status", (req, res) => {});

app.listen(5000, () => {
  console.log("Server running in port 5000");
});
