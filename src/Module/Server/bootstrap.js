require('dotenv').config();

const fs = require('fs');
const { createApp, createServer } = require('yion');
const bodyParser = require('yion-body-parser');
const Container = require('../Common/Service/Container');

module.exports = (options = {
    cache: true,
    websocket: false,
    pwa: false,
    query: false,
    localQuery: false,
    api: false,
    cors: null,
    publicDir: 'public',
    auth: { clientId: 'demo' },
    httpServerPlugins: [],
}) => {
    const basePath = process.cwd();
    const publicDir = options.publicDir ? options.publicDir : 'public';
    const { NODE_PORT = 8080, NODE_ENV = 'dev', LOCALE = 'en', ALLOW_ANONYMOUS = true, API_URL, WEBSOCKET_URL } = process.env;
    const { version, name } = require(`${basePath}/package.json`);
    const cache = {
        'Cache-Control': 'public, max-age=' + (86400 * 30),
        'ETag': Date.now()
    };

    Container.addParameters({
        info: {
            name,
            version,
            env: NODE_ENV,
            locale: LOCALE,
            allowAnonymous: ALLOW_ANONYMOUS,
            apiUrl: API_URL,
            websocketUrl: WEBSOCKET_URL,
            auth: options.auth,
        }
    });

    const app = createApp();

    if (options.query) {
        const Query = require('../Common/Service/Query');

        app.use((req, res, next) => {
            if (!Container.has('Requester')) {
                const { DB_HOST, DB_NAME, DB_CACHE = false } = process.env;
                Container.set('Requester', new Query(DB_HOST, DB_NAME, !!DB_CACHE));
            }

            next();
        });
    }

    if (options.localQuery) {
        const LocalQuery = require('../Common/Service/LocalQuery');

        app.use((req, res, next) => {
            if (!Container.has('Requester')) {
                const { DB_CACHE = false } = process.env;
                Container.set('Requester', new LocalQuery(options.localQuery, !!DB_CACHE));
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
    app.link('/styles', `${basePath}/${publicDir}/styles`, options.cache ? cache : {});
    app.link('/static', `${basePath}/${publicDir}/static`, options.cache ? cache : {});
    app.link('/scripts', `${basePath}/${publicDir}/scripts`, options.cache ? cache : {});
    app.link('/images', `${basePath}/${publicDir}/images`, options.cache ? cache : {});
    app.link('/fonts', `${basePath}/${publicDir}/fonts`, options.cache ? cache : {});
    app.link('/assets', `${basePath}/${publicDir}/assets`, options.cache ? cache : {});

    app.get('/info', (req, res) => {
        res.json(Container.parameters('info'));
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
                apiMiddleware.request(req.original, res.original, next);
            } else {
                next();
            }
        });
    }

    app.get('/', (req, res) => {
        const path = `${basePath}/${publicDir}/index.html`;
        try {
            fs.statSync(path);
            res.sendFile(path, 'index.html', 'text/html', false);
        } catch (e) {
            res.status(404).send(e);
        }
    });

    const httpServer = createServer(app, [bodyParser].concat(options.httpServerPlugins || []));

    httpServer.listen(NODE_PORT);
    httpServer.on('listening', () => console.log(`🌏  Server start on port ${NODE_PORT}`));

    return { httpServer, app };
};
