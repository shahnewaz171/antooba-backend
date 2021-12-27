const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const upload = require('./utils/multer');
const app = express();
const port = 5000;
const bodyParser = require('body-parser');
const cors = require('cors');
const fileUpload = require('express-fileupload');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cors());
app.use(fileUpload());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mkcgo.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const usersCollection = client.db(`${process.env.DB_NAME}`).collection("users");

    app.post('/signup', async (req, res) => {
        try{
            const { name, email, password } = req.body;
            const userExist = await usersCollection.findOne({ email: email});

            if(userExist){
                res.status(200).send({ error: 'User already exists' });
            }
           else{
                const hashPassword = await bcrypt.hash(password, 12);
                const result = await usersCollection.insertOne({ name, email, password: hashPassword });
                res.status(201).send(result);
           }
        }
        catch(err) {
            res.status(500).send(err);
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
                    res.status(200).send(data);
                }
                else{
                    res.status(200).send({error: "Password Incorrect"});
                }
            }
            else{
                res.status(200).send({error: "User does not exist"});
            }
        }
        catch (err) {
            res.status(500).send(err);
        }
    })

});

app.get('/', (req, res) => {
    res.send('Server Running...');
})

app.listen(process.env.PORT || port);
