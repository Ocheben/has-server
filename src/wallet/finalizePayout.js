const axios = require("axios");
const query = require('../queries').query

exports.finalizePayout = async(req, res) => {
    const { transferCode, otp } = req.body
    const payload = {
        transfer_code: transferCode,
        otp
    }
    const finalizeUrl = 'https://api.paystack.co/transfer/finalize_transfer'
    try {
        const response = await axios.post(finalizeUrl, payload, {
            headers: {
                'Authorization': `Bearer ${process.env.PAY_SECRET_TEST}`,
                'Content-Type': 'application/json'
            }
        })
        console.log(response)
        if(response.status) {
            return res.status(200).json({
                meta: {
                    status: 200,
                    message: 'Payout Completed',
                    info: 'Success'
                },
                data: (response.data || {}).data
            })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}