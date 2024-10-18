//decryptor
async function decryptPGPMessage(encryptedMessage, privateKeyArmored, passphrase = null) {
    // Read the armored private key
    let privateKey = await openpgp.readPrivateKey({ armoredKey: privateKeyArmored });

    // Check if the private key is encrypted and requires a passphrase
    if (privateKey.isDecrypted()) {
        // If the private key is already decrypted or does not require a passphrase
        console.log("Private key is not encrypted, no passphrase required.");
    } else if (passphrase) {
        // If a passphrase is provided, decrypt the private key
        console.log("Decrypting private key with passphrase...");
        privateKey = await openpgp.decryptKey({
            privateKey: privateKey,
            passphrase: passphrase
        });
    } else {
        // If the private key is encrypted but no passphrase is provided
        throw new Error("Private key is encrypted but no passphrase was provided.");
    }

    // Read the armored encrypted message
    const message = await openpgp.readMessage({
        armoredMessage: encryptedMessage
    });

    // Decrypt the message using the (possibly decrypted) private key
    const { data: decrypted } = await openpgp.decrypt({
        message: message,
        decryptionKeys: privateKey
    });

    return decrypted;
}
