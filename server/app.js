// app.js
require('dotenv').config();

const express = require('express');
const configureExpress = require('./config/express');

const app = express();

app.use(express.static('client/public'));
configureExpress(app);
