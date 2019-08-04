require('dotenv').config();
const express = require('express');
const db = require('./queries');
const bodyParser = require('body-parser');
const cors = require('cors');
const Sentry = require('@sentry/node');

const app = express();
const port = process.env.PORT || 7000;

Sentry.init({ dsn: 'https://809218825d4a44768cee5509fa3c0888@sentry.io/1521240' });

app.use(express.json())
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
}))


app.get('/', (req, res) => {
    res.send('Hello, Hire a Service')
})
app.get('/db', db.getTable);
app.post('/signup', db.signUp);
app.post('/signup/init', db.initiateSignup);
app.post('/signup/verify', db.verifyOtp);
app.post('/login', db.login);
app.get('/jobs/user/:user_id', db.getJobs);
app.get('/jobs/skill/:skill_id', db.getSkillJobs);
app.get('/jobs/:job_id', db.getJobById);
app.get('/bids/user/:user_id', db.getUserBids);
app.get('/bids/job/:job_id', db.getJobBids);
app.post('/jobs', db.postJob)
app.post('/bids', db.postBid)
app.listen(process.env.PORT, () => {
    console.log(`App running on port ${port}`)
})