const express = require('express');
const { MongoClient } = require('mongodb');
const upload = require('./utils/multer');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');
const cors = require('cors');
const objectId = require('mongodb').ObjectId;
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkcgo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const usersCollection = client.db(`${process.env.DB_NAME}`).collection("users");

    app.post('/signup', async (req, res) => {
        try{
            const userInfo = req.body;
            const userExist = await usersCollection.findOne({ email: userInfo.email});

            if(userExist){
                return res.status(422).json({ error: 'User already exists' });
            }
           else{
                const hashPassword = await bcrypt.hash(userInfo.password, 12);
                const result = await usersCollection.insertOne({ ...userInfo, password: hashPassword });
                res.status(201).send(result);
           }
        }
        catch(err) {
            res.send(err);
        }
    })

    app.post('/login', async (req, res) => {
        try{
            const userInfo = req.body;
            const user = await usersCollection.findOne({ email: userInfo.email});
            if(user){
                const validPassword = await bcrypt.compare(userInfo.password, user.password);
                if(validPassword){
                    const token = await jwt.sign({ _id: user._id }, `${process.envJWT_SECRET}`);
                    const data = { token, user };
                    console.log(data);
                    res.status(201).send(data);
                }
                else{
                    res.status(400).send({error: "Invalid Password"});
                }
            }
            else{
                res.status(401).send({error: "User does not exist"});
            }
        }
        catch (err) {
            res.send(err);
        }
    })

});

app.get('/', (req, res) => {
    res.send('Server Running...');
})

app.listen(process.env.PORT || port);
