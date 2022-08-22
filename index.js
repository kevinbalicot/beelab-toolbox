module.exports = {
    request: require('./src/Module/Common/Service/Request'),
    bootstrapServer: require('./src/Module/Server/bootstrap'),

    YoutubeSearchRepository: require('./src/Module/Youtube/Repository/Search'),
    Container: require('./src/Module/Common/Service/Container'),
};
