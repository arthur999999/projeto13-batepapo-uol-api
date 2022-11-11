import express from "express";
import { MongoClient} from 'mongodb';
import cors from "cors";
import dotenv from 'dotenv';
import joi from 'joi';

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())


const mongoClient = new MongoClient (process.env.MONGO_URI)
let db 
mongoClient.connect(()=> {
    db = mongoClient.db("UOL")
})

app.get('/test', async (req, res)=> {
    try {
        const nonee = await db.collection('mensagens').find().toArray()
        res.send(nonee)
    } catch (error) {
        res.status(500).send(error)
    }
})

app.listen(5000, ()=> {
    console.log('rodando na 5000')
})
