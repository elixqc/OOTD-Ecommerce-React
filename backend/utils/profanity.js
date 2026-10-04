const Filter = require('bad-words');

const filter = new Filter();

// A few common Filipino words on top of the package's English list
filter.addWords('putangina', 'tangina', 'gago', 'gaga', 'ulol', 'tarantado', 'pakyu', 'puta', 'bwisit');

// Replaces bad words with ****. The package throws when the text has no
// letters or digits at all (e.g. "!!!" or only emojis); there is nothing to mask then.
exports.maskBadWords = (text) => {
    try {
        return filter.clean(text);
    } catch {
        return text;
    }
};
