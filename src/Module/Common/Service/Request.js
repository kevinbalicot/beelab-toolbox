const http = require('http');
const https = require('https');

class Request {
    static get(uri, options = {}) {
        return Request.request(uri, { ...options, method: 'GET' });
    }

    static post(uri, body, options = {}) {
        return Request.request(uri, { ...options, method: 'POST' }, body);
    }

    static put(uri, body, options = {}) {
        return Request.request(uri, { ...options, method: 'PUT' }, body);
    }

    static patch(uri, body, options = {}) {
        return Request.request(uri, { ...options, method: 'PATCH' }, body);
    }

    static delete(uri, options = {}) {
        return Request.request(uri, { ...options, method: 'DELETE' });
    }

    static request(uri, options = {}, body = null) {
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(uri);
            const opts = Object.assign({
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + (parsedUrl.search ? parsedUrl.search : ''),
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
    }
}

module.exports = Request;
