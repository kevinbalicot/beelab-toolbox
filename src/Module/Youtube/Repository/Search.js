const Request = require('../../Common/Service/Request');
const YoutubeRepository = require('./Youtube');
const YoutubeVideoRepository = require('./Video');
const YoutubePlaylistRepository = require('./Playlist');

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
        return this.searchPlaylist(term, options).then(playlists => {
            return Promise.all(playlists.map(({ id }) => this.searchPlaylistVideosById(id, options))).then(playlistItems => {
                return playlistItems.map((items, index) => Object.assign(playlists[index], { items }));
            });
        });
    }

    searchVideoById(id) {
        return this.videoRepository.searchById(id);
    }

    searchPlaylistVideosById(id, options = {}) {
        return this.playlistRepository.searchVideosById(id, options);
    }

    _search(url, type, cacheKey) {
        return this.get(cacheKey)
            .then(query => {
                if (!query.result) {
                    return Request.get(url)
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
                id: item.id.videoId || item.id.playlistId,
                title: item.snippet.title,
                image: item.snippet.thumbnails ? item.snippet.thumbnails.medium.url : `https://cataas.com/c/s/${item.snippet.title}?w=400`,
                createdAt: item.snippet.publishedAt,
                channelId: item.snippet.channelId,
            };
        }));
    }
}

module.exports = YoutubeSearchRepository;
