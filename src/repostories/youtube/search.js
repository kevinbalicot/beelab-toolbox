const request = require('./../../services/request');
const YoutubeRepository = require('./youtube');
const YoutubeVideoRepository = require('./video');
const YoutubePlaylistRepository = require('./playlist');

class YoutubeSearchRepository extends YoutubeRepository {
    constructor(keys, query) {
        super(keys, query, 'youtube-search');

        this.videoRepository = new YoutubeVideoRepository(keys, query);
        this.playlistRepository = new YoutubePlaylistRepository(keys, query);
    }

    search(term, options = {}) {
        const maxResults = options.maxResults || 10;
        const url = `${this.url}/search?q=${term}&key=${this.secret}&maxResults=${maxResults}&part=snippet`;

        return this._search(url, 'search', `${term}-${maxResults}`);
    }

    searchVideos(term, options = {}) {
        return this.search(term, options).then(videos => Promise.all(videos.map(({ id }) => this.searchVideoById(id))));
    }

    searchRelated(id, options = {}) {
        const maxResults = options.maxResults || 10;
        const url = `${this.url}/search?relatedToVideoId=${id}&type=video&key=${this.secret}&videoDuration=long&maxResults=${maxResults}&part=snippet`;

        return this._search(url, 'search', `related-${id}-${maxResults}`);
    }

    searchRelatedVideos(id, options = {}) {
        return this.searchRelated(id, options).then(videos => Promise.all(videos.map(({ id }) => this.searchVideoById(id))));
    }

    searchPlaylist(term, options = {}) {
        const maxResults = options.maxResults || 10;
        const url = `${this.url}/search?q=${term}&type=playlist&key=${this.secret}&maxResults=${maxResults}&part=snippet`;

        return this._search(url, 'playlist', `playlist-${term}-${maxResults}`);
    }

    searchPlaylistVideos(term, options = {}) {
        return this.searchPlaylist(term, options).then(playlists => Promise.all(playlists.map(({ id }) => this.searchPlaylistVideosById(id))));
    }

    searchVideoById(id) {
        return this.videoRepository.searchById(id);
    }

    searchPlaylistVideosById(id) {
        return this.playlistRepository.searchVideosById(id);
    }

    _search(url, type, cacheKey) {
        return this.get(cacheKey)
            .then(query => {
                if (!query.result) {
                    return request(url)
                        .then(response => this._parseResponse(response, type))
                        .then(items => this._mapSearchItems(items))
                        .then(items => this.set(cacheKey, items))
                    ;
                }

                return query.result.value;
            })
        ;
    }

    _mapSearchItems(items) {
        return Promise.resolve(items.map(item => {
            return {
                id: item.id.videoId || item.id.playlistId,
                title: item.snippet.title,
                image: item.snippet.thumbnails.medium.url,
                createdAt: item.snippet.publishedAt,
                channelId: item.snippet.channelId,
            };
        }));
    }
}

module.exports = YoutubeSearchRepository;
