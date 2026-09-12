const app = require('./app');
const { PORT, SERVER_ID } = require('./config');

app.listen(PORT, () => {
  console.log(`[${SERVER_ID}] enterprise-api-backend listening on http://localhost:${PORT}`);
});
