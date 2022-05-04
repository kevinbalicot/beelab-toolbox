const fs = require('fs');
const request = require('../services/request');
const Requester = require('../services/query');

module.exports = (app, options = {
    cache: true,
    websocket: false,
    pwa: false,
    query: false,
    api: false,
    cors: null,
    publicDir: 'public'
}) => {
    const { NODE_ENV = 'dev', LOCALE = 'en', API_URL, WEBSOCKET_URL } = process.env;
    const basePath = process.cwd();
    const publicDir = options.publicDir || 'public';
    const { version, name } = require(`${basePath}/package.json`);
    const cache = {
        'Cache-Control': 'public, max-age=' + (86400 * 30),
        'ETag': Date.now()
    };

    if (options.query) {
        app.use((req, res, next) => {
            if (!app.requester) {
                const { DB_HOST, DB_NAME, DB_CACHE = false } = process.env;
                app.requester = new Requester(DB_HOST, DB_NAME, !!DB_CACHE);
            }

            next();
        });
    }

    if (options.cors) {
        app.use((req, res, next) => {
            res.set('Access-Control-Allow-Origin', options.cors);
            res.set('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept, Origin, Authorization');
            res.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');

            if (req.method === 'OPTIONS') {
                return res.send();
            }

            next();
        });
    }

    if (options.cache) {
        // validate cache
        app.use((req, res, next) => {
            if (req.headers['if-none-match'] && req.headers['if-none-match'] === cache['ETag']) {
                return res.status(304).send();
            }

            next();
        });
    }

    if (options.pwa) {
        app.use((req, res, next) => {
            res.set('Service-Worker-Allowed', '/');

            next();
        });

        app.get('/sw.js', (req, res) => {
            res.set('Content-Type', 'application/javascript');

            return res.send(`
                importScripts('/scripts/sw.js');

                if (initServiceWorker) {
                    initServiceWorker(self, "${name}-${version}");
                }
            `);
        });
    }

    app.link('/modules', `${basePath}/node_modules`, options.cache ? cache : {});
    app.link('/dist', basePath + '/dist', options.cache ? cache : {});
    app.link('/style', `${basePath}/${publicDir}/styles`, options.cache ? cache : {});
    app.link('/static', `${basePath}/${publicDir}/static`, options.cache ? cache : {});
    app.link('/scripts', `${basePath}/${publicDir}/scripts`, options.cache ? cache : {});
    app.link('/images', `${basePath}/${publicDir}/images`, options.cache ? cache : {});
    app.link('/fonts', `${basePath}/${publicDir}/fonts`, options.cache ? cache : {});
    app.link('/assets', `${basePath}/${publicDir}/assets`, options.cache ? cache : {});

    app.get('/info', (req, res) => {
        const config = { locale: LOCALE, env: NODE_ENV, allowAnonymous: true };

        if (API_URL) {
            config['api'] = API_URL;
        }

        if (WEBSOCKET_URL) {
            config['websocketUrl'] = WEBSOCKET_URL;
        }

        request(`https://crudaas.beelab.tk/configuration/${name}`, { headers: { 'User-Agent': req.userAgent } })
            .then(data => res.json(Object.assign(config, { version, name }, JSON.parse(data))))
            .catch(() => res.json(Object.assign(config, { version, name }, { auth: { clientId: 'demo' }})));
    });

    if (options.api) {
        const tamiaApi = require.main.require('@tamia-web/tamia');
        const docPlugin = require.main.require('@tamia-web/doc-plugin');

        const apiMiddleware = tamiaApi(options.api, { plugins: [docPlugin] });

        app.use((req, res, next) => {
            if (req.url.match(/^\/api/)) {
                req.original.url = req.original.url.replace('/api', '');
                req.original.body = req.body;
                req.original.params = req.params;
                req.original.query = req.query;
                req.original.requester = app.requester;
                apiMiddleware.request(req.original, res.original, next);
            } else {
                next();
            }
        });
    }

    app.get('/', (req, res) => {
        console.log(`${basePath}/${publicDir}/index.html`)
        const path = `${basePath}/${publicDir}/index.html`;
        try {
            fs.statSync(path);
            res.sendFile(path, 'index.html', 'text/html', false);
        } catch (e) {
            res.status(404).send(e);
        }
    });
};
