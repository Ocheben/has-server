require('dotenv').config();
const express = require('express');
const db = require('./queries');
const getUsers = require('./admin/users/getUsers').getUsers
const verifyUser = require('./admin/users/verifyUser').verifyUser
const getBanks = require('./wallet/getBanks').getBanks
const addNuban = require('./wallet/addNuban').addNuban
const initPayout = require('./wallet/initPayout').initPayout
const finalizePayout = require('./wallet/finalizePayout').finalizePayout
const bodyParser = require('body-parser');
const cors = require('cors');
const Sentry = require('@sentry/node');

const app = express();
const port = process.env.PORT || 7000;

Sentry.init({ dsn: 'https://d11ef976a4df4019aa7a79862da76ccd@sentry.io/1521250' });

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler());

// app.use(express.json())
app.use(cors());
app.use(bodyParser.json({ limit: '10mb', extended: true }));
app.use(bodyParser.urlencoded({
    limit: '10mb',
    extended: true,
}))


app.get('/', (req, res) => {
    res.send('Hello, Hire a Service')
})
app.get('/db', db.getTable);
app.post('/signup', db.signUp);
app.post('/create_admin', db.createAdmin);
app.post('/signup/init', db.initiateSignup);
app.post('/signup/verify', db.verifyOtp);
app.post('/login', db.login);
app.get('/jobs', db.getJobs);
app.get('/skills', db.getSkills);
app.get('/jobs/skill/:skill_id', db.getSkillJobs);
app.get('/jobs/:job_id', db.getJobById);
app.get('/jobs/user/:user_id', db.getJobByUser);
app.get('/bids/user/:user_id', db.getUserBids);
app.get('/bids/job/:job_id', db.getJobBids);
app.post('/jobs', db.postJob);
app.post('/bids', db.postBid);
app.post('/bids/accept',db.acceptBid)
app.post('/jobs/complete',db.completeJob)

// Wallet
app.post('/wallet/add_nuban', addNuban);
app.post('/wallet/init_payout', initPayout);
app.post('/wallet/finalize_payout', finalizePayout);
app.post('/wallet', db.creditWallet);

// Admin
app.post('/users/verify', verifyUser)
app.get('/users', getUsers);
app.get('/banks', getBanks)

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler());
app.listen(process.env.PORT, () => {
    console.log(`App running on port ${port}`)
})