const url = require('url');
const http = require('http');
const https = require('https');

module.exports = (uri, options = {}, body = null) => {
    return new Promise((resolve, reject) => {
        const parsedUrl = url.parse(uri);
        const opts = Object.assign({
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: parsedUrl.pathname + parsedUrl.search
        }, options);

        const callback = (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        };

        let req;
        if ('https:' === parsedUrl.protocol) {
            req = https.request(opts, callback);
        } else {
            req = http.request(opts, callback);
        }

        if (body !== null) {
            req.write(body);
        }

        req.on('error', error => reject(error));
        req.end();
    });
};
