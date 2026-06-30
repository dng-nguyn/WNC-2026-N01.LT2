const http = require('http');
const port = process.env.PORT || 3000;
http.get(`http://127.0.0.1:${port}/health`, (res) => {
  process.exit(res.statusCode === 200 ? 0 : 1);
}).on('error', () => process.exit(1));
