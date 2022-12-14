const Request = require('../../Common/Service/Request');
const YoutubeRepository = require('./Youtube');

class YoutubePlaylistRepository extends YoutubeRepository {
    constructor(keys, query) {
        super(keys, query, 'youtube-playlist');
    }

    searchById(id) {
        const url = `${this.url}/videos?id=${id}&key=${this.secret}&part=snippet,contentDetails`;

        return this.get(id)
            .then(query => {
                if (!query.result) {
                    return Request.get(url)
                        .then(response => this._parseResponse(response, 'playlist'))
                        .then(items => this._mapPlaylistItems(items[0]))
                        .then(item => this.set(id, item))
                    ;
                }

                return query.result.value;
            })
        ;
    }

    searchVideosById(id, options = {}) {
        const maxResults = options.maxResults || 10;
        const key = `videos-${id}-${maxResults}`;
        const url = `${this.url}/playlistItems?playlistId=${id}&key=${this.secret}&maxResults=${maxResults}&part=snippet,contentDetails`;

        return this.get(key)
            .then(query => {
                if (!query.result) {
                    return Request.get(url)
                        .then(response => this._parseResponse(response, 'playlistItem'))
                        .then(items => this._mapPlaylistItems(items))
                        .then(item => this.set(key, item))
                    ;
                }

                return query.result.value;
            })
        ;
    }

    _mapPlaylistItems(items) {
        return Promise.resolve(items.map(item => {
            return {
                id: item.snippet.resourceId.videoId,
                createdAt: item.snippet.publishedAt,
                channelId: item.snippet.channelId,
                title: item.snippet.title,
                image: item.snippet.thumbnails ? item.snippet.thumbnails.medium.url : `https://cataas.com/c/s/${item.snippet.title}?w=400`
            };
        }));
    }
}

module.exports = YoutubePlaylistRepository;
