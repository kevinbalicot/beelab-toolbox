const Datastore = require.main.require('nedb');

class LocalQuery {
    /**
     * @param {object} collections
     * @param {boolean} [useCache=false]
     */
    constructor(collections, useCache = false) {
        this.db = {};
        this.useCache = useCache;
        this.storedQueries = [];

        for (const collection in collections) {
            this.db[collection] = new Datastore({filename: collections[collection], timestampData: true});
        }

        for (const dbName in this.db) {
            this.db[dbName].loadDatabase();
        }
    }

    /**
     * Play find query
     * @param {string} collection
     * @param {Object} params
     * @param {number} [skip=0]
     * @param {number} [limit=100]
     * @param {Object} [sort=null]
     *
     * @return {Promise}
     */
    find(collection, params, skip = 0, limit = 100, sort = null) {
        const id = `${collection}.find.${JSON.stringify(params)}.${skip}.${limit}.${JSON.stringify(sort)}`;
        const query = {id, collection, type: 'find', cached: false, result: null};

        return new Promise((resolve, reject) => {
            const queryFromCache = this.fromCache(id);

            if (queryFromCache) {
                return resolve(queryFromCache);
            }

            this.db[collection].find(params).skip(skip).limit(limit).sort(sort).exec((error, docs) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = docs;
                this.cache(query);

                return resolve(query);
            });
        });
    }

    /**
     * Play find one query
     * @param {string} collection
     * @param {Object} params
     *
     * @return {Promise}
     */
    findOne(collection, params) {
        const id = `${collection}.findOne.${JSON.stringify(params)}`;
        const query = {id, collection, type: 'findOne', cached: false, result: null};

        return new Promise((resolve, reject) => {
            const queryFromCache = this.fromCache(id);

            if (queryFromCache) {
                return resolve(queryFromCache);
            }

            if (!!params.id || !!params._id) {
                params._id = params._id || params.id;
                delete params.id;
            }

            this.db[collection].findOne(params, (error, doc) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = doc;
                this.cache(query);

                return resolve(query);
            });
        });
    }

    /**
     * Play insert query
     * @param {string} collection
     * @param {Object} params
     *
     * @return {Promise}
     */
    insert(collection, params) {
        const id = `${collection}.insert.${JSON.stringify(params)}`;
        const query = {id, collection, type: 'insert', cached: false, result: null};

        return new Promise((resolve, reject) => {
            this.db[collection].insert(params, (error, newDocs) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = newDocs;
                this.clearCache(collection);

                return resolve(query);
            });
        });
    }

    /**
     * Play insert many query
     * @param {string} collection
     * @param {Object} params
     *
     * @return {Promise}
     */
    insertMany(collection, params) {
        return this.insert(collection, params);
    }

    /**
     * Play remove query
     * @param {string} collection
     * @param {Object} selector
     *
     * @return {Promise}
     */
    remove(collection, selector) {
        const id = `${collection}.remove.${JSON.stringify(selector)}`;
        const query = {id, collection, type: 'remove', cached: false, result: null};

        return new Promise((resolve, reject) => {
            if (!!selector.id || !!selector._id) {
                selector._id = selector._id || selector.id;
                delete selector.id;
            }

            this.db[collection].remove(selector, {}, (error, numRemoved) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = numRemoved;
                this.clearCache(collection);

                return resolve(query);
            });
        });
    }

    /**
     * Play remove many query
     * @param {string} collection
     * @param {Object} selector
     * @param {Object} [options=null]
     *
     * @return {Promise}
     */
    removeMany(collection, selector) {
        const id = `${collection}.remove.${JSON.stringify(selector)}`;
        const query = {id, collection, type: 'removeMany', cached: false, result: null};

        return new Promise((resolve, reject) => {
            if (!!selector.id || !!selector._id) {
                selector._id = selector._id || selector.id;
                delete selector.id;
            }

            this.db[collection].remove(selector, {multi: true}, (error, numRemoved) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = numRemoved;
                this.clearCache(collection);

                return resolve(query);
            });
        });
    }

    /**
     * Play update query
     * @param {string} collection
     * @param {Object} selector
     * @param {Object} params
     *
     * @return {Promise}
     */
    update(collection, selector, params) {
        const id = `${collection}.update.${JSON.stringify(selector)}.${JSON.stringify(params)}`;
        const query = {id, collection, type: 'update', cached: false, result: null};

        return new Promise((resolve, reject) => {
            if (!!selector.id || !!selector._id) {
                selector._id = selector._id || selector.id;
                delete selector.id;
            }

            this.db[collection].update(selector, params, {}, (error, numReplaced) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = numReplaced;
                this.clearCache(collection);


                return resolve(query);
            });
        });
    }

    /**
     * Play update query
     * @param {string} collection
     * @param {Object} selector
     * @param {Object} params
     *
     * @return {Promise}
     */
    updateMany(collection, selector, params) {
        const id = `${collection}.update.${JSON.stringify(selector)}.${JSON.stringify(params)}`;
        const query = {id, collection, type: 'updateMany', cached: false, result: null};

        return new Promise((resolve, reject) => {
            if (!!selector.id || !!selector._id) {
                selector._id = selector._id || selector.id;
                delete selector.id;
            }

            this.db[collection].update(selector, params, {multi: true}, (error, numReplaced) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = numReplaced;
                this.clearCache(collection);

                return resolve(query);
            });
        });
    }

    /**
     * Play count query
     * @param {string} collection
     * @param {Object} [params=null]
     *
     * @return {Promise}
     */
    count(collection, params = {}) {
        const id = `${collection}.count.${JSON.stringify(params)}`;
        const query = {id, collection, type: 'count', cached: false, result: null};

        return new Promise((resolve, reject) => {
            const queryFromCache = this.fromCache(id);

            if (queryFromCache) {
                return resolve(queryFromCache);
            }

            this.db[collection].find(params, (error, docs) => {
                if (!!error) {
                    return reject(error);
                }

                query.result = docs.length;
                this.cache(query);

                return resolve(query);
            });
        });
    }

    /**
     * Run query
     * @param {Object} query
     *
     * @return {Promise}
     */
    query({
        collection,
        params,
        type,
        limit,
        skip,
        sort,
        selector
    }) {
        if (type === 'find') {
            return this.find(collection, params, skip, limit, sort);
        } else if (type === 'findOne') {
            return this.findOne(collection, params);
        } else if (type === 'insert') {
            return this.insert(collection, params);
        } else if (type === 'insertMany') {
            return this.insertMany(collection, params);
        } else if (type === 'remove') {
            return this.remove(collection, selector);
        } else if (type === 'removeMany') {
            return this.removeMany(collection, selector);
        } else if (type === 'update') {
            return this.update(collection, selector, params);
        } else if (type === 'updateMany') {
            return this.updateMany(collection, selector, params);
        } else if (type === 'count') {
            return this.count(collection, params);
        }

        return Promise.reject('Query type is undefined.');
    }

    /**
     * @param {String} [collection=null]
     *
     * @returns {[]}
     */
    clearCache(collection = null) {
        if (null === collection) {
            return this.storedQueries = [];
        }

        this.storedQueries = this.storedQueries.filter(q => q.collection !== collection);
    }

    /**
     * @param {String} id
     * @returns {*}
     */
    fromCache(id) {
        return this.storedQueries.find(q => q.id === id);
    }

    /**
     * @param {Object} query
     */
    cache(query) {
        if (this.useCache) {
            query.cached = true;
            this.storedQueries.push(query);
        }
    }
}

module.exports = LocalQuery;
