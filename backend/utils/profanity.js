const Filter = require('bad-words');

const filter = new Filter();

// added custom words to the filter
filter.addWords('putangina', 'tangina', 'gago', 'gaga', 'ulol', 'tarantado', 'pakyu', 'puta', 'bwisit');

exports.maskBadWords = (text) => {
    try {
        return filter.clean(text);
    } catch {
        return text;
    }
};
