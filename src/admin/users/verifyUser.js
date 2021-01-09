const query = require('../../queries').query

exports.verifyUser = async(req, res) => {
    const { verify, userId } = req.body;
    const verifyQuery = 'UPDATE users SET verified = $1 WHERE user_id = $2';
    const queryValues = [verify, userId]
    try {
        const verifyUser = await query(verifyQuery, queryValues)
        // if(!verifyUser.rows[0]) {
        //     return res.status(404).json({
        //         meta:{
        //             status: 404,
        //             message: 'No Records found',
        //             info: 'No Records found'
        //         }
        //     })
        // } else {
        //     return res.status(200).json({
        //         meta:{
        //             status: 200,
        //             message: 'Success',
        //             info: 'Success'
        //         },
        //         data: {
        //             users: getUsers.rows
        //         }
        //     })
        // }
        console.log(verifyUser)
        return res.status(200).json({
            meta:{
                status: 200,
                message: 'Success',
                info: 'Success'
            }
        })
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}