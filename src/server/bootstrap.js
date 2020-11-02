const fs = require('fs');
const request = require('../services/request');

module.exports = (app, options = { cache: true }) => {
    const { NODE_ENV = 'dev', LOCALE = 'en', API_URL, ALLOW_ANONYMOUS, WEBSOCKET_URL } = process.env;
    const basePath = process.cwd();
    const cache = {
        'Cache-Control': 'public, max-age=' + (86400 * 30),
        'ETag': Date.now()
    };

    if (options.cache) {
        // validate cache
        app.use((req, res, next) => {
            if (req.headers['if-none-match'] && req.headers['if-none-match'] === cache['ETag']) {
                return res.status(304).send();
            }

            next();
        });
    }

    app.link('/modules', basePath + '/node_modules', options.cache ? cache : {});
    app.link('/dist', basePath + '/dist', options.cache ? cache : {});
    app.link('/style', basePath + '/public/styles', options.cache ? cache : {});
    app.link('/images', basePath + '/public/images', options.cache ? cache : {});
    app.link('/fonts', basePath + '/public/fonts', options.cache ? cache : {});

    app.get('/info', (req, res) => {
        const { version, name } = require(`${basePath}/package.json`);
        const config = { locale: LOCALE, env: NODE_ENV, allowAnonymous: !!ALLOW_ANONYMOUS };

        if (API_URL) {
            config['api'] = API_URL;
        }

        if (WEBSOCKET_URL) {
            config['websocketUrl'] = WEBSOCKET_URL;
        }

        request(`https://back.beelab.tk/configuration/${name}`, { headers: { 'User-Agent': req.userAgent } })
            .then(data => res.json(Object.assign(config, { version, name }, JSON.parse(data))));
    });

    app.get('/', (req, res) => {
        const path = basePath + '/public/index.html';
        try {
            fs.statSync(path);
            res.sendFile(path, 'index.html', 'text/html', false);
        } catch (e) {
            res.status(404).send(e);
        }
    });
};
