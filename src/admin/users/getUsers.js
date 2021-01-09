const query = require('../../queries').query

exports.getUsers = async(req, res) => {
    const { verified } = req.query;
    const getQuery = `SELECT * FROM users${verified !== undefined ? ' WHERE verified = $1' : ''}`;
    console.log(getQuery, verified)
    const queryValues = [...(verified !== undefined ? [verified] : [])]
    try {
        const getUsers = await query(getQuery, queryValues)
        if(!getUsers.rows[0]) {
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
                    users: getUsers.rows
                }
            })
        }
    }
    catch (err) {
        console.log(err)
        return res.status(400).send(err)
    }
}