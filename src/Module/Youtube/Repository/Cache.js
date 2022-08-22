class CacheRepository {
    constructor(db, collection) {
        this.db = db;
        this.collection = collection;
    }

    get(key) {
        return this.db.query({
            collection: this.collection,
            type: 'findOne',
            params: { key }
        });
    }

    set(key, value) {
        this.db.query({
            collection: this.collection,
            type: 'insert',
            params: { key, value }
        });

        return Promise.resolve(value);
    }
}

module.exports = CacheRepository;
