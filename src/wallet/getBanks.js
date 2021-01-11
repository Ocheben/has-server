const axios = require("axios");
const query = require('../queries').query

exports.getBanks = async(req, res) => {
    console.log('getting banks')
    const getBanksUrl = 'https://api.paystack.co/bank'
    try {
        const banksList = await axios.get(getBanksUrl, {
            headers: {
                'Authorization': `Bearer ${process.env.PAY_SECRET_TEST}`
            }
        })
        console.log(banksList)
        if(banksList.status) {
            return res.status(200).json({
                meta: {
                    status: 200,
                    message: 'Success',
                    info: 'Success'
                },
                data: banksList.data
            })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}