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

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
  db = mongoClient.db("batePapoUol");
});

const nameSchema = joi.object({
  name: joi.string().min(1).required(),
  lastStatus: joi.number(),
});

const messageSchema = joi.object({
  from: joi.string().required(),
  to: joi.string().min(1).required(),
  text: joi.string().min(1).required(),
  type: joi.string().valid("message", "private_message").required(),
  time: joi.string(),
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
    await db.collection("messages").insertOne({
      from: participante.name,
      to: "Todos",
      text: "entra na sala...",
      type: "status",
      time: dayjs().format("HH/mm/ss"),
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
      res.status(404);
      return;
    }
  } catch (err) {
    res.status(500).send(err.message);
  }
});

app.post("/messages", async (req, res) => {
  const { to, text, type } = req.body;
  const { user } = req.headers;
  try {
    const mensagem = {
      from: user,
      to,
      text,
      type,
      time: dayjs().format("HH/mm/ss"),
    };

    const validation = messageSchema.validate(mensagem, { abortEarly: false });
    if (validation.error) {
      const errors = validation.error.details.map((d) => d.message);
      res.sendStatus(422).send(errors);
      return;
    }
    const nameExists = await db
      .collection("participants")
      .findOne({ name: user });
    if (!nameExists) {
      res.sendStatus(409);
      return;
    }

    await db.collection("messages").insertOne(mensagem);

    res.sendStatus(201);
  } catch (err) {
    res.sendStatus(500).send(err.message);
  }
});

app.get("/messages", async (req, res) => {
  const limit = Number(req.query.limit);
  const { user } = req.headers;
  try {
    const mensagens = await db.collection("messages").find({}).toArray();
    const FiltroMensagens = mensagens.filter((mensagem) => {
      const Publica = mensagem.type === "message";
      const UserMsg =
        mensagem.to === "Todos" ||
        mensagem.to === user ||
        mensagem.from === user;
      return Publica || UserMsg;
    });

    res.send(FiltroMensagens.slice(-limit));
  } catch (err) {
    res.sendStatus(500).send(err.message);
  }
});

app.post("/status", async (req, res) => {
  const { user } = req.headers;

  try {
    const usuarioExistente = await db
      .collection("participants")
      .findOne({ name: user });
    if (!usuarioExistente) {
      res.sendStatus(404);
      return;
    }

    await db
      .collection("participants")
      .updateOne({ name: user }, { $set: { lastStatus: Date.now() } });

    res.sendStatus(200);
  } catch (err) {
    res.status(500).send(err.message);
  }
});

setInterval(async () => {
  const tempo = Date.now() - 10 * 1000;
  try {
    const inativos = await db
      .collection("participants")
      .find({ lastStatus: { $lte: tempo } })
      .toArray();
    if (inativos.length > 0) {
      const msgInativo = inativos.map((i) => {
        return {
          from: i.name,
          to: "Todos",
          text: "sai da sala...",
          type: "status",
          time: dayjs().format("HH/mm/ss"),
        };
      });
      await db.collection("messages").insertMany(msgInativo);
      await db
        .collection("participants")
        .deleteMany({ lastStatus: { $lte: tempo } });
    }
  } catch (err) {
    res.sendStatus(500).send(err.message);
  }
}, 15000);

app.listen(5000, () => {
  console.log("Server running in port 5000");
});
