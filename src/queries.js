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
    // const sandboxApiKey = '5d79ca484c5eb4542c9e617a29c46628ce215f81d5e1b7c64feb8179bd2dd7ef';
    const apiKey = '1ece7b909315c24cbb8eea9174ce3a5b595858462d182ac85aabae32a22734c0';
    const randomNumber = Math.floor(1000 + Math.random() * 9000);
    const message = 'Your login verification code is: ' + randomNumber;
    const africasTalking = new AfricasTalking({
        username: 'hireaservice',
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
    const {firstname, lastname, email, phone, password, validid} = req.body;
    const hashPassword = Helper.hashPassword(password);
    const verifyQuery = 'SELECT exists (SELECT 1 FROM otps WHERE phone = $1 AND isVerified = true LIMIT 1)'
    const createQuery = 'INSERT INTO users (firstname, lastname, email, phone, password, valid_id) VALUES ($1, $2, $3, $4, $5, $6)';
    const checkEmailQuery = 'SELECT exists (SELECT 1 FROM users WHERE email = $1 LIMIT 1)';
    const checkPhoneQuery = 'SELECT exists (SELECT 1 FROM users WHERE phone = $1 LIMIT 1)';
    const emailQuery = 'SELECT * FROM users WHERE email = $1';
    const values = [firstname, lastname, email, phone, hashPassword, validid];
    console.log(firstname, lastname, email, phone, password);
    
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
        const createUser = await query(createQuery, values);
        console.log(createUser)
        // const token = Helper.generateToken(phone);
        const getUser = await query(emailQuery, [email])
        // console.log(getUser)
        const token = Helper.generateToken(getUser.rows[0].phone);
        const user = getUser.rows[0]
        return res.status(200).json({
            meta:{
                status: 200,
                message:'Succesfully logged in',
            },
            data: {
                jwt: token,
                role: 'admin',
                token,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone,
                rating: user.rating,
                jobsCompleted: user.jobs_completed,
                walletBal: user.wallet_bal,
                userId: user.user_id
                // userId: checkEmail.rows[0].userid
            }
        });
    } catch (err) {
        return res.status(400).send(err);
    }
}

const createAdmin = async (req, res) => {
    const {username, password} = req.body;
    const hashPassword = Helper.hashPassword(password);
    const createQuery = 'INSERT INTO admins (username, password) VALUES ($1, $2)';
    const values = [username, hashPassword];
    
    try {
        const createUser = await query(createQuery, values);
        return res.status(200).json({
            meta:{
                status: 200,
                message:'Succesfully created admin',
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
        const user = checkEmail.rows[0]
        return res.status(200).json({
            meta:{
                status:200, 
                message:`Welcome back ${checkEmail.rows[0].firstname}`, 
                info:"Successful Login",
            },
            data: {
                token,
                firstname: user.firstname,
                lastname: user.lastname,
                email: user.email,
                phone: user.phone,
                rating: user.rating,
                jobsCompleted: user.jobs_completed,
                walletBal: user.wallet_bal,
                role: 'admin',
                userId: user.user_id
            }
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}

const adminLogin = async(req, res) => {
    console.log('logging in')
    const { username, password } = req.body;
    const usernameQuery = 'SELECT * FROM admins WHERE username = $1';

    try {
        const checkUsername = await query(usernameQuery, [username])
        if ( !checkUsername.rows[0] ) {
            return res.status(406).json({meta: {status: 406, message: "Username is incorrect", info: "Username is incorrect"}})
        }
        if (!Helper.comparePassword(checkUsername.rows[0].password, password)) {
            return res.status(406).json({meta:{status:406, message: 'Password is incorrect', info:'password is incorrect'}})
        }
        const token = Helper.generateToken(checkUsername.rows[0].phone);
        const user = checkUsername.rows[0]
        return res.status(200).json({
            meta:{
                status:200, 
                message:`Welcome back ${checkUsername.rows[0].username}`, 
                info:"Successful Login",
            },
            data: {
                token,
                username
            }
        })
    } catch (err) {
        return res.status(400).send(err)
    }
}

const getJobs = async(req, res) => {
    // const { user_id } = req.params;
    const getQuery = "SELECT j.*, u.firstname, u.lastname, u.email, u.phone FROM jobs j JOIN users u on j.user_id = u.user_id";
    try {
        const getJob = await query(getQuery);
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

const getSkills = async(req, res) => {
    // const { user_id } = req.params;
    const getQuery = "SELECT * FROM skills";
    try {
        const getSkill = await query(getQuery);
        if(!getSkill.rows[0]) {
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
                    skills: getSkill.rows
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

const getJobByUser = async(req, res) => {
    const { user_id } = req.params;
    const getQuery = "SELECT * FROM jobs WHERE user_id = $1";
    console.log(user_id)
    try {
        const getJob = await query(getQuery, [user_id]);
        console.log(getJob, user_id)
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

const postJob = async(req, res) => {
    const { userId, jobTitle, jobDesc, price, skillId, date } = req.body;
    const addQuery = "INSERT INTO jobs (user_id, job_title, job_desc, price, skill_id, date_added) VALUES ($1, $2, $3, $4, $5, $6)";
    const values = [userId, jobTitle, jobDesc, price, skillId, date]

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
    const getQuery = "SELECT b.*, u.firstname, u.lastname, u.email, u.phone, j.job_title, j.job_desc FROM bids b join users u on b.client_id = u.user_id join jobs j on b.job_id = j.job_id WHERE b.user_id = $1";
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
    const {userId, jobId, skillId, skillLevel, message, duration, price, date, clientId} = req.body;
    const addQuery = "INSERT INTO bids(user_id, job_id, skill_id, skill_level, message, duration, price, date_added, client_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
    const values = [userId, jobId, skillId, skillLevel, message, duration, price, date, clientId];

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

const creditWallet = async (req, res) => {
    const { email, amount } = req.body;
    const uptQuery = 'UPDATE users SET wallet_bal = wallet_bal + $1 where email = $2';
    const values = [amount, email];

    try {
        await query(uptQuery, values);
        res.status(200).json({
            meta: {
                status: 200,
                message: 'Wallet Credited',
                info: 'Succesful'
            }
        });
    } catch (err) {
        return res.status(400).send(err);
    }
}

const acceptBid = async (req, res) => {
    const { userId, jobId, bidId, providerId, price } = req.body;
    const uptJobQuery = 'UPDATE jobs SET assigned = $1, assigned_to = $2, date_assigned = $3, bid_id = $4 where job_id = $5';
    const uptBidQuery = 'UPDATE bids SET accepted = $1, client_id = $2, date_accepted = $3 where bid_id = $4';
    const uptClientQuery = 'UPDATE users SET wallet_bal = wallet_bal - $1 where user_id = $2'
    const date = new Date().toISOString()
    const jobValues = [true, providerId, date, bidId, jobId];
    const bidValues = [true, userId, date, bidId]
    const clientValues = [price, userId]
    // console.log(jobValues, bidValues)
    console.log(price, userId)

    try {
        await query(uptJobQuery, jobValues);
        await query(uptBidQuery, bidValues);
        await query(uptClientQuery, clientValues)
        res.status(200).json({
            meta: {
                status: 200,
                message: 'Bid Accepted',
                info: 'Succesful'
            }
        });
    } catch (err) {
        console.log(err)
        return res.status(400).send(err);
    }
}

const completeJob = async (req, res) => {
    console.log('completing job')
    const { userId, jobId, bidId, providerId, rating, price } = req.body;
    const uptJobQuery = 'UPDATE jobs SET completed = $1, date_completed = $2 WHERE job_id = $3';
    const uptBidQuery = 'UPDATE bids SET completed = $1, date_completed = $2, rating = $3 where bid_id = $4';
    const uptClientQuery = 'UPDATE users SET jobs_completed = jobs_completed + 1 where user_id = $1'
    const uptProviderQuery = 'UPDATE users SET bids_completed = bids_completed + 1, rating = ((rating * bids_completed) + $1)/(bids_completed + 1), wallet_bal = wallet_bal + $2 where user_id = $3'
    const date = new Date().toISOString()
    const jobValues = [true, date, jobId];
    const bidValues = [true, date, rating, bidId]
    const providerValues = [rating, parseInt(price, 10), providerId]
    const clientValues = [userId]
    // console.log(jobValues, bidValues)
    console.log(jobValues)
    try {
        await query(uptJobQuery, jobValues);
        
        const bid = await query(uptBidQuery, bidValues);
        const client = await query(uptClientQuery, clientValues);
        const provider = await query(uptProviderQuery, providerValues);
        // console.log(job, bid, client, provider)
        res.status(200).json({
            meta: {
                status: 200,
                message: 'Job Completed',
                info: 'Succesful'
            }
        });
    } catch (err) {
        console.log(err)
        return res.status(400).send(err);
    }
}

module.exports = {
    getTable,
    signUp,
    createAdmin,
    adminLogin,
    initiateSignup,
    verifyOtp,
    login,
    getJobs,
    getSkills,
    getSkillJobs,
    getJobById,
    getJobByUser,
    getUserBids,
    getJobBids,
    postJob,
    postBid,
    testfun,
    creditWallet,
    acceptBid,
    completeJob,
    query
}