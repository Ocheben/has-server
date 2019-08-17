import 'babel-polyfill'
const Pool = require('pg').Pool;
const AfricasTalking = require('africastalking');
const Helper = require('./helper')

// const pool = new Pool({
//     user: 'bhjeoeeuvtvzkc',
//     host : 'ec2-54-247-96-169.eu-west-1.compute.amazonaws.com',
//     database : 'd5lhea00phtve7',
//     password: '2da6daebcef4611e4dac496c95191789ce3fbd2b7dbb6c79d4fa31577d7e69c7',
//     port: 5432,
//     ssl:true
// })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

const testfun = () => {
    return true
}
const query = (text, params) => {
    // eslint-disable-next-line no-undef
    return new Promise((resolve, reject) => {
      pool.query(text, params)
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        reject(err);
      })
    })
  }

const getTable = (req, res) => {
    pool.query('SELECT * FROM users', (error, results) => {
        if(error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
}

// const signUp = (req, res) => {
//     console.log(req.body)
//     const {firstname, lastname, email, phone, password} = req.body;
//     pool.query('SELECT exists (SELECT 1 FROM users WHERE email = $1 OR phone = $2 LIMIT 1)', [email, phone], (error, results) => {
//         if (error) {
//             throw error
//         }
//         else if(results.rows[0].exists) {
//             res.status(406).json({meta: {status: 406, message: "Email or Phone has already been used to create an account", info: "email or phone exists in database"}})
//         }
//         else {
//             pool.query('INSERT INTO users (firstname, lastname, email, phone, password) VALUES ($1, $2, $3, $4, $5)', [firstname, lastname, email, phone, password],
//             (error, results) => {
//                 if (error) {
//                     throw error
//                 }
//                 res.status(200).json({meta: {status: 200, message: 'Your account has been created', info: 'Account successfully created'}})
//             })
//         }
//     })
// }

const initiateSignup = async (req, res) => {
    const {email, phone, } = req.body;
    const checkEmailQuery = 'SELECT exists (SELECT 1 FROM users WHERE email = $1 LIMIT 1)';
    const checkPhoneQuery = 'SELECT exists (SELECT 1 FROM users WHERE phone = $1 LIMIT 1)';
    const addOtpQuery = 'INSERT INTO otps (phone, otp) VALUES ($1, $2) ON CONFLICT (phone) DO UPDATE SET otp = $2'
    const apiKey = '5d79ca484c5eb4542c9e617a29c46628ce215f81d5e1b7c64feb8179bd2dd7ef';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const message = 'Your login verification code is: ' + randomNumber;
    const africasTalking = new AfricasTalking({
        username: 'sandbox',
        apiKey: apiKey,
    });
    
    const sms = africasTalking.SMS;

    try {
        const checkEmail = await query(checkEmailQuery, [email])
        if ( checkEmail.rows[0].exists ) {
            return res.status(406).json({meta: {status: 406, message: "Email has already been used to create an account", info: "email exists in database"}})
        }
        const checkPhone = await query(checkPhoneQuery, [phone])
        if ( checkPhone.rows[0].exists ) {
            return res.status(406).json({meta: {status: 406, message: "Phone number has already been used to create an account", info: "phone exists in database"}})
        }
        sms.send({
            to: phone,
            message: message,
        })
        .then(async(response)=> {
            console.log('Message Sent!');
            console.log(response);
            await query(addOtpQuery, [phone, randomNumber]);
            return res.status(200).json({meta: {status: 200, message: `One time password has been sent to ${phone}`, info: 'OTP sent'}})
        })
        .catch(function(error) {
            console.log('Message Failed!');
            console.log(error);
        });
    } catch (err) {
        return res.status(400).send(err);
    }
}

const verifyOtp = async (req, res) => {
    const { phone, otp } = req.body
    const checkQuery = 'SELECT exists (SELECT 1 FROM otps WHERE phone = $1 AND otp = $2 LIMIT 1)';
    const verifyQuery = 'UPDATE otps SET isVerified = $1 WHERE phone = $2'

    try {
        const verify = await query(checkQuery, [phone, otp]);
        if (verify.rows[0].exists) {
            await query(verifyQuery, [true, phone]);
            res.status(200).json({meta: {status: 200, message: 'Valid otp', info: 'Valid otp'}});
        }
        else {
            res.status(404).json({meta: {status: 404, message: 'Invalid otp', info: 'Invalid otp'}})
        }
    } catch (err) {
        return res.status(400).send(err);
    }
}

const signUp = async (req, res) => {
    const {firstname, lastname, email, phone, password} = req.body;
    const hashPassword = Helper.hashPassword(password);
    const verifyQuery = 'SELECT exists (SELECT 1 FROM otps WHERE phone = $1 AND isVerified = true LIMIT 1)'
    const createQuery = 'INSERT INTO users (firstname, lastname, email, phone, password) VALUES ($1, $2, $3, $4, $5)';
    const checkEmailQuery = 'SELECT exists (SELECT 1 FROM users WHERE email = $1 LIMIT 1)';
    const checkPhoneQuery = 'SELECT exists (SELECT 1 FROM users WHERE phone = $1 LIMIT 1)';
    const values = [firstname, lastname, email, phone, hashPassword];
    
    try {
        const checkEmail = await query(checkEmailQuery, [email])
        if ( checkEmail.rows[0].exists ) {
            return res.status(406).json({meta: {status: 406, message: "Email has already been used to create an account", info: "email exists in database"}})
        }
        const checkPhone = await query(checkPhoneQuery, [phone])
        if ( checkPhone.rows[0].exists ) {
            return res.status(406).json({meta: {status: 406, message: "Phone number has already been used to create an account", info: "phone exists in database"}})
        }
        const checkOtp = await query(verifyQuery, [phone]);
        if ( !checkOtp.rows[0].exists ) {
            return res.status(404).json({meta: {status: 404, message: `Phone number has not been verified`, info: "phone not verified"}})
        }
        await query(createQuery, values);
        const token = Helper.generateToken(phone);
        return res.status(200).json({
            meta:{
                status:200,
                message:'Succesfully logged in',
            },
            data: {
                jwt: token,
                role: 'admin',
                userId: checkEmail.rows[0].userid
            }
        });
    } catch (err) {
        return res.status(400).send(err);
    }
}

const login = async(req, res) => {
    const { email, password } = req.body;
    const emailQuery = 'SELECT * FROM users WHERE email = $1';

    try {
        const checkEmail = await query(emailQuery, [email])
        if ( !checkEmail.rows[0] ) {
            return res.status(406).json({meta: {status: 406, message: "Email is incorrect", info: "Email is incorrect"}})
        }
        if (!Helper.comparePassword(checkEmail.rows[0].password, password)) {
            return res.status(406).json({meta:{status:406, message: 'Password is incorrect', info:'password is incorrect'}})
        }
        const token = Helper.generateToken(checkEmail.rows[0].phone);
        return res.status(200).json({
            meta:{
                status:200, 
                message:`Welcome back ${checkEmail.rows[0].firstname}`, 
                info:"Successful Login",
            },
            data: {
                token,
                firstname: checkEmail.rows[0].firstname,
                lastname: checkEmail.rows[0].lastname,
                role: 'admin',
                userId: checkEmail.rows[0].user_id
            }
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}

const getJobs = async(req, res) => {
    const { user_id } = req.params;
    const getQuery = "SELECT * FROM jobs WHERE user_id = $1";
    try {
        const getJob = await query(getQuery, [user_id]);
        if(!getJob.rows[0]) {
            return res.status(404).json({
                meta:{
                    status: 404,
                    message: 'No Records found',
                    info: 'No Records found'
                }
            })
        } else {
            return res.status(200).json({
                meta:{
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: {
                    jobs: getJob.rows
                }
            })
        }
    }
    catch (err) {
        return res.status(400).send(err)
    }
}

const getSkillJobs = async(req, res) => {
    const { skill_id } = req.params;
    const getQuery = "SELECT * FROM jobs WHERE skill_id = $1";
    try {
        const getJob = await query(getQuery, [skill_id]);
        if(!getJob.rows[0]) {
            return res.status(404).json({
                meta:{
                    status: 404,
                    message: 'No Records found',
                    info: 'No Records found'
                }
            })
        } else {
            return res.status(200).json({
                meta:{
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: {
                    jobs: getJob.rows
                }
            })
        }
    }
    catch (err) {
        return res.status(400).send(err)
    }
}

const getJobById = async(req, res) => {
    const { job_id } = req.params;
    const getQuery = "SELECT * FROM jobs WHERE job_id = $1";
    try {
        const getJob = await query(getQuery, [job_id]);
        if(!getJob.rows[0]) {
            return res.status(404).json({
                meta:{
                    status: 404,
                    message: 'No Records found',
                    info: 'No Records found'
                }
            })
        } else {
            return res.status(200).json({
                meta:{
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: {
                    job: getJob.rows[0]
                }
            })
        }
    }
    catch (err) {
        return res.status(400).send(err)
    }
}

const postJob = async(req, res) => {
    const { userId, jobTitle, jobDesc, price, skillId, duration, date } = req.body;
    const addQuery = "INSERT INTO jobs (user_id, job_title, job_desc, price, skill_id, duration, date_added) VALUES ($1, $2, $3, $4, $5, $6, $7)";
    const values = [userId, jobTitle, jobDesc, price, skillId, duration, date]

    try {
        await query(addQuery, values);
        res.status(200).json({
            meta:{
                status: 200,
                message: "Job successfully posted",
                info: "OK"
            }
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}

const getUserBids = async(req, res) => {
    const { user_id } = req.params;
    const getQuery = "SELECT * FROM bids WHERE user_id = $1";
    try {
        const getBids = await query(getQuery, [user_id]);
        if(!getBids.rows[0]) {
            return res.status(404).json({
                meta:{
                    status: 404,
                    message: 'No Records found',
                    info: 'No Records found'
                }
            })
        } else {
            return res.status(200).json({
                meta:{
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: {
                    bids: getBids.rows
                }
            })
        }
    }
    catch (err) {
        return res.status(400).send(err)
    }
}
const getJobBids = async(req, res) => {
    const { job_id } = req.params;
    const getQuery = "SELECT b.*, u.firstname, u.lastname, u.email, u.phone FROM bids b join users u on b.user_id = u.user_id WHERE b.job_id = $1";
    try {
        const getBids = await query(getQuery, [job_id]);
        if(!getBids.rows[0]) {
            return res.status(404).json({
                meta:{
                    status: 404,
                    message: 'No Records found',
                    info: 'No Records found'
                }
            })
        } else {
            return res.status(200).json({
                meta:{
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: {
                    bids: getBids.rows
                }
            })
        }
    }
    catch (err) {
        return res.status(400).send(err)
    }
}

const postBid = async(req, res) => {
    const {userId, jobId, skillId, skillLevel, message, duration, price, date} = req.body;
    const addQuery = "INSERT INTO bids(user_id, job_id, skill_id, skill_level, message, duration, price, date_added) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)";
    const values = [userId, jobId, skillId, skillLevel, message, duration, price, date];

    try {
        await query(addQuery, values);
        res.status(200).json({
            meta: {
                status: 200,
                message: "Bid posted successfully posted",
                info: "Succesful"
            }
        })
    } catch (err) {
        return res.status(400).send(err);
    }
}

module.exports = {
    getTable,
    signUp,
    initiateSignup,
    verifyOtp,
    login,
    getJobs,
    getSkillJobs,
    getJobById,
    getUserBids,
    getJobBids,
    postJob,
    postBid,
    testfun
}