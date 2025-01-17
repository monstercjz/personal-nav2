// backend/server.js
const app = require('./app');
const constants = require('./config/constants');
const port = constants.PORT;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});