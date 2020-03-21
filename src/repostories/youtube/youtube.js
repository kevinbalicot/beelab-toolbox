const CacheRepository = require('./../cache');

class YoutubeRepository extends CacheRepository {
    constructor(keys, db, cacheCollection) {
        super(db, cacheCollection);

        if (!Array.isArray(keys)) {
            keys = [keys];
        }

        this.keys = keys;
        this.url = 'https://www.googleapis.com/youtube/v3';
    }

    _parseResponse(response, type = 'search') {
        const filters = {
            'search': item => item.id.videoId && item.snippet && item.snippet.liveBroadcastContent !== 'live',
            'video': item => item.id && item.snippet && item.liveBroadcastContent !== 'live',
            'playlist': item => item.id.playlistId && item.snippet && item.snippet.liveBroadcastContent !== 'live',
            'playlistItem': item => item.id && item.snippet,
        };

        return new Promise((resolve, reject) => {
            try {
                const data = JSON.parse(response);
                if (data.error) {
                    return reject(data.error);
                }

                let items = [];
                if (data.items) {
                    items = data.items.filter(item => filters[type](item));
                }

                return resolve(items);
            } catch (e) {
                return reject(e);
            }
        });
    }

    _iso8601toSeconds(input) {
        const reptms = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;
        let hours = 0, minutes = 0, seconds = 0, totalseconds;

        if (reptms.test(input)) {
            const matches = reptms.exec(input);
            if (matches[1]) hours = Number(matches[1]);
            if (matches[2]) minutes = Number(matches[2]);
            if (matches[3]) seconds = Number(matches[3]);
            totalseconds = hours * 3600  + minutes * 60 + seconds;
        }

        return totalseconds;
    }

    get secret() {
        const now = new Date();

        return this.keys[now.getHours() % this.keys.length];
    }
}

module.exports = YoutubeRepository;
