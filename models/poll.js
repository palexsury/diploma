const mongoose = require('mongoose');
const PollSchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    answers: {
        type: Array,
        required: true,
    },
    results: {
        type: Array,
        required: true,
    },
    publicPollKey: {
        type: String,
        required: true
    },
    privatePollKey: {
        type: String,
        required: true
    }
});
const Poll = mongoose.model('Poll', PollSchema);

module.exports = Poll;