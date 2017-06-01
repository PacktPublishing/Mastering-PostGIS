const http = require('http');
const server = http.createServer((req, res) => {
        console.warn('Processing request...');
res.end('Hello world!');
});
const port  = 8080;
server.listen(port,  () => {
    console.warn('Server listening on http://localhost:%s', port);
});