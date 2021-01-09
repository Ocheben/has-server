const axios = require("axios");
const query = require('../queries').query

exports.initPayout = async(req, res) => {
    const { nubanRef, amount, userId } = req.body;
    if (nubanRef === undefined || amount === undefined || userId === undefined) {
        return res.status(400).json({
            meta:{
                status: 400,
                message: 'Missing Parameters',
                info: 'Error'
            }
        })
    }

    const getUserQuery = 'SELECT exists (SELECT 1 FROM users WHERE user_id = $1 AND wallet_bal >= $2 AND verified = true LIMIT 1)'
    const getUserValues = [userId, amount]

    // Init Payoutnuban
    const payoutUrl = 'https://api.paystack.co/transfer'
    const payoutPayload = {
        source: 'balance',
        amount,
        recipient: nubanRef,
        reason: 'Hire a Service Payout'
    }
    try {
        const verifyUser = await query(getUserQuery, getUserValues)
        console.log('verifyUser')
        console.log(verifyUser)
        if (!verifyUser.rows[0].exists) {
            return res.status(404).json({ meta: { status: 404, message: 'You cannot withdraw this amount', info: 'user has insufficient funds' } })
        }
        
        const payoutResponse = await axios.post(payoutUrl, payoutPayload, {
            headers: {
                'Authorization': `Bearer ${process.env.PAY_SECRET_TEST}`,
                'Content-Type': 'application/json'
            }
        })
        console.log(payoutResponse)

        if(payoutResponse.status === 200 && payoutResponse.data.status) {
            const { reference, integration, transfer_code, createdAt, id, status } = payoutResponse.data.data
            const addPayoutQuery = 'INSERT INTO payouts (user_id, nuban_ref, amount, id, reference, integration, transfer_code, created_at, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)';
            const addPayoutValues = [userId, nubanRef, amount/100, id, reference, integration, transfer_code, createdAt, status]
            try {
                const addPayoutResponse = await query(addPayoutQuery, addPayoutValues);
                console.log(addPayoutResponse)
                
            } catch (err) {
                console.log(err)
                return res.status(500).json({
                    meta: {
                        status: 500
                    }
                })
            }
            return res.status(200).json({
                meta: {
                    status: 200,
                    message: 'Payout Successfully Initiated',
                    info: 'Success'
                },
            })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}