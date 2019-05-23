require('dotenv').config();
const express = require('express');
const db = require('./queries');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express()
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}))
app.use(express.json())
app.use(cors());
const port = process.env.PORT || 7000;

app.get('/', (req, res) => {
    res.send('Hello, Hire a Service')
})
app.get('/db', db.getTable);
app.post('/signup', db.signUp);
app.post('/signup/init', db.initiateSignup);
app.post('/signup/verify', db.verifyOtp)
app.post('/login', db.login)
app.listen(process.env.PORT || 5000, () => {
    console.log(`App running on port ${port}`)
})