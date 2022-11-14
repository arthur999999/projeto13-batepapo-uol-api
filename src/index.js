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



app.post('/participants', async (req, res)=> {
    const userName = req.body

    const validation = nameSchamer.validate(userName, { abortEarly: true} )

    if (validation.error){
        res.status(422).send(validation.error.details)
        return
    }

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


    try {
        await db.collection('participantes').insertOne({name: userName.name, lastStatus: Date.now()}), db.collection('mensagens').insertOne({from: userName.name , to: 'Todos', text: 'entra na sala...', type: 'status', time: `${(dayjs().hour() < 10 ? '0' + dayjs().hour() : dayjs().hour() )}:${(dayjs().minute() < 10 ? '0' + dayjs().minute() : dayjs().minute() )}:${(dayjs().second() < 10 ? '0' + dayjs().second() : dayjs().second() )}`})
        res.sendStatus(201)
    } catch (error) {
        res.status(422).send(error)
    }
})

app.get('/participants', async (req, res) =>{
    try {
        const participantes = await db.collection('participantes').find().toArray()
        res.send(participantes)
    } catch (error) {
        res.status(422).send(error)
    }
})

const messageSchamer = joi.object({
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.any().valid('message', 'private_message').required()
})

app.post('/messages', async (req, res) => {
    const messageReq = req.body
    const userr = req.headers.user
    
    

    if(!userr){
        res.status(422).send('Nome de usuário inválido')
        return
    }

    const validation = messageSchamer.validate(messageReq, { abortEarly: false} )

    if (validation.error){
        res.status(422).send(validation.error.details)
        return
    }

   

    try {
        const sameName = await db.collection('participantes').findOne({name: userr})
        if(!sameName){
            res.status(404).send('Esse usuário não existe')
            return
        }
    } catch (error) {
        res.send(error).status(422)
    }

    

    try {
        await db.collection('mensagens').insertOne({
            from: userr ,
            to: messageReq.to,
            text: messageReq.text,
            type: messageReq.type,
            time: `${(dayjs().hour() < 10 ? '0' + dayjs().hour() : dayjs().hour() )}:${(dayjs().minute() < 10 ? '0' + dayjs().minute() : dayjs().minute() )}:${(dayjs().second() < 10 ? '0' + dayjs().second() : dayjs().second() )}`
        })
        res.sendStatus(201)
    } catch (error) {
        res.status(422).send(error.message)
    }


})

app.get('/messages', async (req, res)=> {
    const {limit} = req.query
    const userr = req.headers.user

    try {
        const listMenssages = await db.collection('mensagens').find().toArray()
        const listFilter = listMenssages.filter((m)=> m.from == userr || m.to == "Todos" || m.to == userr)
        if(listFilter.length > limit){
            let x = listFilter.length - limit
            listFilter.splice(0, x)
        }
        res.send(listFilter)
        

    } catch (error) {
        res.status(422).send(error.message)
    }
})

app.listen(5000, ()=> {
    console.log('rodando bipbop')
})
