// app.js

const express = require('express');
const cors = require('cors'); // Import the cors middleware
const { router } = require('./routes/routes');

const app = express();
const port = 8080;

// Use cors middleware to enable CORS
app.use(cors());

app.use(express.json());
app.use(router);

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
