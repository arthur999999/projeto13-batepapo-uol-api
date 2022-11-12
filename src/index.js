import express from "express";
import { MongoClient} from 'mongodb';
import cors from "cors";
import dotenv from 'dotenv';
import joi from 'joi';
import dayjs from 'dayjs';

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())


const mongoClient = new MongoClient (process.env.MONGO_URI)
let db 
mongoClient.connect(()=> {
    db = mongoClient.db("UOL")
})

const nameSchamer = joi.object({
    name: joi.string().required()
})

dayjs().format('mm')

app.post('/participants', async (req, res)=> {
    const userName = req.body

    try {
        const sameName = await db.collection('participantes').find().toArray()
        for(let element of sameName){
            if(userName.name == element.name){
                res.sendStatus(409)
                return
            }
        }
    } catch (error) {
        res.status(422).send(error)
    }

    const validation = nameSchamer.validate(userName, { abortEarly: true} )

    if (validation.error){
        res.status(422).send(validation.error.details)
        return
    }

    try {
        await db.collection('participantes').insertOne({name: userName.name, lastStatus: Date.now()}), db.collection('mensagens').insertOne({from: userName.name , to: 'Todos', text: 'entra na sala...', type: 'status', time: `${(dayjs().hour() < 10 ? '0' + dayjs().hour() : dayjs().hour() )}:${(dayjs().minute() < 10 ? '0' + dayjs().minute() : dayjs().minute() )}:${(dayjs().second() < 10 ? '0' + dayjs().second() : dayjs().second() )}`})
        res.sendStatus(201)
    } catch (error) {
        res.status(422).send(error)
    }
})

app.listen(process.env.PORT, ()=> {
    console.log('rodando bipbop')
})
