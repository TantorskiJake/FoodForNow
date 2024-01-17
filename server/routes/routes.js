const express = require('express');
const routes = express.Router()
routes.get('/',(req,res) => {res.send('Hello world or soemthin')})
module.exports = {routes}