
module.exports = {

    matchYoutube(url) {
        const match = url.match(/(?:www.)*youtu(?:.be\/|be.com\/(?:.*)\/|be.com\/watch\?v=)([^"&?\/\s]{11})/);

        if (match) {
            return { pattern: match[0], result: match[1] };
        }

        return null;
    }
};
