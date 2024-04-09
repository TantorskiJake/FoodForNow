// server/app.js

require('dotenv').config();

const express = require('express');
const configureExpress = require('./config/express');

const app = express();

app.use(express.static('client/public'));
configureExpress(app);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
