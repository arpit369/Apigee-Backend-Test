// pm2 config: runs both backend instances from one file.
// Usage on server:  pm2 start ecosystem.config.js
module.exports = {
  apps: [
    {
      name: 'backend-1',
      script: 'src/server.js',
      env: { PORT: 3001, SERVER_ID: 'backend-1' },
    },
    {
      name: 'backend-2',
      script: 'src/server.js',
      env: { PORT: 3002, SERVER_ID: 'backend-2' },
    },
  ],
};
