
module.exports = {
    matcher: require('./src/services/matcher'),
    request: require('./src/services/request'),
    bootstrapServer: require('./src/server/bootstrap'),

    Query: require('./src/services/query'),
    YoutubeSearchRepository: require('./src/repostories/youtube/search'),
};
