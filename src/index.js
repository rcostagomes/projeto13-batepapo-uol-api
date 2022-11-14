import express from "express";
import cors from "cors";
import dayjs from "dayjs";
import dotenv from "dotenv";
import Joi from "joi";
import { MongoClient } from "mongodb";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json())

app.listen(5000, ()=> {console.log("Running in ort 5000")})
