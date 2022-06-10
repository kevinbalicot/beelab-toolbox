
module.exports = {
    matcher: require('./src/services/matcher'),
    request: require('./src/services/request'),
    bootstrapServer: require('./src/server/bootstrap'),

    YoutubeSearchRepository: require('./src/repostories/youtube/search'),
};
