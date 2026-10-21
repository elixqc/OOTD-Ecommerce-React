// U1-A · Bad words — bad-words filter plus a Filipino word list.
// mask()/isProfane() are used by controllers/review.js to mask public comments and flag the admin view.
const Filter = require('bad-words');

const filter = new Filter();

// added custom words to the filter
filter.addWords(
    'putangina',
    'tangina',
    'gago',
    'gaga',
    'ulol',
    'tarantado',
    'pakyu',
    'puta',
    'bwisit',
);

exports.maskBadWords = (text) => {
    try {
        return filter.clean(text);
    } catch {
        return text;
    }
};
