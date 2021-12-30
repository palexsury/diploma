const mongoose = require('mongoose');
const EncryptedBallotSchema = new mongoose.Schema({
    pollId: {
        type: String,
        default: ''
    },
    userEmail: {
        type: String,
        required: true
    },
    encryptedresult: {
        type: String,
        required: true,
    }
});
const EncryptedBallot = mongoose.model('EncryptedBallot', EncryptedBallotSchema);

module.exports = EncryptedBallot;