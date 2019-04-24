const express = require('express');

const app = express()

const port = process.env.PORT || 7000;

app.get('/', (req, res) => {
    res.send('Hello, Hire a Service')
})
app.listen(process.env.PORT || 5000, () => {
    console.log(`App running on port ${port}`)
})