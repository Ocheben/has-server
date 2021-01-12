const axios = require("axios");
const query = require('../queries').query

exports.addNuban = async(req, res) => {
    const { nuban, bankCode, userId } = req.body;
    let recipientCode;
    console.log('bank')
    if (nuban === undefined || bankCode === undefined || userId === undefined) {
        return res.status(400).json({
            meta:{
                status: 400,
                message: 'Missing Parameters',
                info: 'Error'
            }
        })
    }

    // Verify nuban
    const verifyUrl = `https://api.paystack.co/bank/resolve?account_number=${nuban}&bank_code=${bankCode}`
    // const queryValues = [verify, userId]
    console.log(process.env.PORT)
    try {
        const nubanResponse = await axios.get(verifyUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.PAY_SECRET_TEST}`
            }
        })
        console.log(nubanResponse)
        // const verifyUser = await query(verifyQuery, queryValues)
        // console.log(verifyUser)

        if(nubanResponse.status === 200 && nubanResponse.data.status) {
            const { account_number, account_name } = nubanResponse.data.data
            const transRefUrl = 'https://api.paystack.co/transferrecipient'
            const transRefPayload = {
                type: 'nuban',
                name: account_name,
                account_number, 
                bank_code: bankCode,
                currency: "NGN"
            }
            try {
                const transRefResponse = await axios.post(transRefUrl, transRefPayload, {
                    headers: {
                        'Authorization': `Bearer ${process.env.PAY_SECRET_TEST}`,
                        'Content-Type': 'application/json'
                    }
                })
                // console.log(transRefResponse)
                if (transRefResponse.status === 201 && transRefResponse.data.status) {
                    const { recipient_code } = transRefResponse.data.data
                    const addNubanQuery = 'UPDATE users SET nuban = $1, nuban_name = $2, nuban_code = $3, nuban_ref = $4 WHERE user_id = $5';
                    const addNubanValues = [account_number, account_name, bankCode, recipient_code, userId]
                    try {
                        const addNubanResponse = await query(addNubanQuery, addNubanValues);
                        console.log('Nuban REspnse')
                        console.log(addNubanResponse)
                        recipientCode = recipient_code
                        
                    } catch (err) {
                        console.log(err)
                        return res.status(500).json({
                            meta: {
                                status: 500
                            }
                        })
                    }
                }
            } catch (err) {
                console.log(err)
                return res.status(500).json({
                    meta: {
                        status: 500
                    }
                })
            }
            const bankData = nubanResponse.data.data
            return res.status(200).json({
                meta: {
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: bankData,
                recipientCode
            })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}