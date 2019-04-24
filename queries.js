const Pool = require('pg').Pool;
// const pool = new Pool({
//     user: 'bhjeoeeuvtvzkc',
//     host : 'ec2-54-247-96-169.eu-west-1.compute.amazonaws.com',
//     database : 'd5lhea00phtve7',
//     password: '',
//     port: 5432
// })

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: true
});

const getTable = (req, res) => {
    pool.query('SELECT * FROM users', (error, results) => {
        if(error) {
            throw error
        }
        res.status(200).json(results.rows)
    })
}

module.exports = {
    getTable
}