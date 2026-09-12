// Central config from env. No secrets here — Apigee owns auth.
module.exports = {
  PORT: parseInt(process.env.PORT, 10) || 3001,
  SERVER_ID: process.env.SERVER_ID || 'backend-1',
  MAX_DELAY_SECONDS: 10, // cap /delay so it can't hang forever
  MAX_LARGE_COUNT: 1000, // cap /data/large payload size
  BODY_LIMIT: '5mb', // let Apigee enforce real message-size limits
};
