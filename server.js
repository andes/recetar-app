const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/api', createProxyMiddleware({
    target: 'http://localhost:4000/api',
    changeOrigin: true,
}));

app.use(express.static('./dist/preinscriptions-control/browser'));

app.get('/*', (req, res) =>
    res.sendFile('index.html', {root: 'dist/preinscriptions-control/browser/'}),
);

app.listen(process.env.PORT || 8080);
