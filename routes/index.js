const express = require('express');
const openpgp = require('openpgp');
const router = express.Router();
const { ensureAuthenticated } = require('../config/auth')
const Poll = require('../models/poll');
const User = require('../models/user');
const EncryptedBallot = require('../models/EncryptedBallot');

//login page
router.get('/', (req, res) => {
    res.render('welcome');
})
//register page
/*router.get('/register', (req, res) => {
    res.render('register');
})*/
router.get('/pollboard', ensureAuthenticated, (req, res) => {
    Poll.find()
        .then((polls) => {
            res.render('pollboard', {
                user: req.user,
                polls: polls,
            });
        })
})

router.get('/pollboard/create', ensureAuthenticated, (req, res) => {
    res.render('createpoll', {
        user: req.user
    })
})

router.post('/pollboard/create', ensureAuthenticated, (req, res) => {
    const { title, description, answers } = req.body;
    let errors = [];
    console.log(' Title ' + title + ' description :' + description + ' answers:' + answers);
    if (!title || !answers) {
        errors.push({ msg: "Please fill title and description fields fields" })
        res.render('createpoll');
    }
    var id;
    Poll.estimatedDocumentCount()
        .then((count) => {
            id = count + 1;
        });
    (async () => {
        const { privateKey, publicKey } = await openpgp.generateKey({
            type: 'rsa', // Type of the key
            rsaBits: 4096, // RSA key size (defaults to 4096 bits)
            userIDs: [{ name: 'Jon Smith', email: 'jon@example.com' }], // you can pass multiple user IDs
            passphrase: 'super long and hard to guess secret' // protects the private key
        });
        console.log(answers);
        const answersArray = answers.split('\r\n');
        const results = new Array(answersArray.length).fill('0');
        const newPoll = new Poll({
            id: id,
            title: title,
            description: description,
            answers: answersArray,
            results: results,
            publicPollKey: publicKey,
            privatePollKey: privateKey
        })
        newPoll.save()
            .then((value) => {
                console.log(value)
                //req.flash('success_msg', 'Голосование создано');
                res.redirect('/pollboard')
            })
            .catch(value => console.error(value));
    })();
    //res.render('createpoll');
})

router.get('/pollboard/view', ensureAuthenticated, (req, res) => {
    const id = req.query.id;
    console.log(id);
    Poll.findOne({ id: id }).exec((err, poll) => {
        console.log(poll);
        if (poll) {
            //console.log(poll);
            res.render('result', {
                user: req.user,
                poll: poll
            });
        } else {
            res.redirect('/pollboard', {
                user: req.user
            })
        }
    })
})

router.get('/pollboard/vote', ensureAuthenticated, (req, res) => {
    const id = req.query.id;
    console.log(id);
    Poll.findOne({ id: id }).exec((err, poll) => {
        console.log(poll);
        if (poll) {
            //console.log(poll);
            res.render('vote', {
                user: req.user,
                poll: poll
            });
        } else {
            res.redirect('/pollboard', {
                user: req.user
            })
        }
    })
})

router.post('/pollboard/vote', ensureAuthenticated, (req, res) => {
    console.log(req.body);
    const pollId = req.body.pollId;
    const userEmail = req.body.userEmail;
    const answerId = req.body.answerId;
    const encryptedBallot = req.body.encryptedBallot;
    const newEncryptedBallot = new EncryptedBallot({
        pollId: pollId,
        userEmail: userEmail,
        encryptedresult: encryptedBallot
    })
    newEncryptedBallot.save()
        .then((value) => {
            res.redirect('/pollboard')
        })
        .catch(value => console.error(value));
    User.findOne({ email: userEmail }).exec((err, user) => {
        if (user) {
            const publicUserKey = user.publicKey;
            console.log(pollId);
            Poll.findOne({ id: pollId }).exec((err, poll) => {
                console.log(poll);
                if (poll) {
                    const privatePollKey = poll.privatePollKey;
                    (async () => {
                        const verified = await decryptAndVerifyBallot(encryptedBallot, publicUserKey, privatePollKey, answerId);
                        if (verified) {
                            console.log('Получилось!');
                            Poll.findOne({ id: pollId }).exec((err, poll) => {
                                console.log(poll);
                                if (poll) {
                                    //const results = poll.results;
                                    var newResults = [...poll.results];
                                    newResults[Number(answerId) - 1]++;
                                    Poll.findOneAndUpdate({ id: pollId }, { results: newResults })
                                        .then((value) => {
                                            //console.log(value);
                                        });
                                }
                            });
                        }
                    })();
                }
            })
        }
    })
})

async function decryptAndVerifyBallot(encryptedBallot, userPublicKey, privatePollKey, answerId) {
    const message = await openpgp.readMessage({
        armoredMessage: encryptedBallot // parse armored message
    });
    const passphrase = 'super long and hard to guess secret';
    const privateKey = await openpgp.decryptKey({
        privateKey: await openpgp.readPrivateKey({ armoredKey: privatePollKey }),
        passphrase
    });
    const { data: decrypted, signatures } = await openpgp.decrypt({
        message,
        decryptionKeys: privateKey
    });
    console.log(decrypted);
    const publicKey = await openpgp.readKey({ armoredKey: userPublicKey });
    const signature = await openpgp.readSignature({
        armoredSignature: decrypted // parse detached signature
    });
    const verificationResult = await openpgp.verify({
        message: await openpgp.createMessage({ text: answerId }), // Message object
        signature,
        verificationKeys: publicKey
    });
    console.log(verificationResult);
    const { verified, keyID } = verificationResult.signatures[0];
    try {
        await verified; // throws on invalid signature
        console.log('Signed by key id ' + keyID.toHex());
        return true;
    } catch (e) {
        throw new Error('Signature could not be verified: ' + e.message)
    }
}


module.exports = router; 