const request = require('./../../services/request');
const YoutubeRepository = require('./youtube');

class YoutubeVideoRepository extends YoutubeRepository {
    constructor(keys, query) {
        super(keys, query, 'youtube-video');
    }

    searchById(id) {
        const url = `${this.url}/videos?id=${id}&key=${this.secret}&part=snippet,contentDetails`;

        return this.get(id)
            .then(query => {
                if (!query.result) {
                    return request(url)
                        .then(response => this._parseResponse(response, 'video'))
                        .then(items => this._mapVideoItem(items[0]))
                        .then(item => this.set(id, item))
                    ;
                }

                return query.result.value;
            })
        ;
    }

    _mapVideoItem(item) {
        return Promise.resolve({
            id: item.id,
            createdAt: item.snippet.publishedAt,
            channelId: item.snippet.channelId,
            title: item.snippet.title,
            image: item.snippet.thumbnails.medium.url,
            duration: this._iso8601toSeconds(item.contentDetails.duration)
        });
    }
}

module.exports = YoutubeVideoRepository;
