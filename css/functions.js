async function signAndEncryptballot(publicPollKey) {
    const checked = document.querySelector('input[type=radio]:checked')
    const privateKeyArmored = localStorage.getItem('privateKey');
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
      passphrase: 'super long and hard to guess secret'
    });
    const message = await openpgp.createMessage({ text: checked.id });
    const detachedSignature = await openpgp.sign({
      message, // Message object
      signingKeys: privateKey,
      detached: true
    });
    const publicKey = await openpgp.readKey({ armoredKey: publicPollKey });
    console.log(detachedSignature);
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: detachedSignature }), // input as Message object
      encryptionKeys: publicKey
    })
    console.log(encrypted);
    document.getElementById('encryptedBallot').value = encrypted;
    document.getElementById('answerId').value = checked.id;
};

async function sign(text) {
  (async () => {
    const privateKeyArmored = localStorage.getItem('privateKey');
    const privateKey = await openpgp.decryptKey({
      privateKey: await openpgp.readPrivateKey({ armoredKey: privateKeyArmored }),
      passphrase: 'super long and hard to guess secret'
    });
    const message = await openpgp.createMessage({ text: text });
    const detachedSignature = await openpgp.sign({
      message, // Message object
      signingKeys: privateKey,
      detached: true
    });
    //console.log(detachedSignature);
    return detachedSignature;
  })();
}

async function encrypt(publicPollKeyArmored, text) {
  (async () => {
    const publicKey = await openpgp.readKey({ armoredKey: publicPollKeyArmored });
    console.log(text);
    const encrypted = await openpgp.encrypt({
      message: await openpgp.createMessage({ text: text }), // input as Message object
      encryptionKeys: publicKey
    })
    console.log(encrypted);
    return encrypted;
  })();
}

function generateKeys() {
  if ('publicKey' in localStorage) {
    document.getElementById('publicKey').value = localStorage.getItem('publicKey');
    return;
  }
  (async () => {
    const { privateKey, publicKey } = await openpgp.generateKey({
      type: 'rsa', // Type of the key
      rsaBits: 2048, // RSA key size (defaults to 4096 bits)
      userIDs: [{ name: 'Jon Smith', email: 'jon@example.com' }], // you can pass multiple user IDs
      passphrase: 'super long and hard to guess secret', // protects the private key
    });
    localStorage.setItem('publicKey', publicKey);
    localStorage.setItem('privateKey', privateKey);
    document.getElementById('publicKey').value = publicKey;
  })();
}