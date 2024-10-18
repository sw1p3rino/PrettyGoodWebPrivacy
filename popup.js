document.getElementById('saveButton').addEventListener('click', function() {
    const pgpKey = document.getElementById('pgpKey').value;
    const passphrase = document.getElementById('passphrase').value;

    // Store the PGP key and passphrase in Chrome storage
    chrome.storage.local.set({ pgpKey, passphrase }, function() {
        document.getElementById('statusMessage').textContent = 'Key saved successfully!';
    });
});

document.getElementById('loadButton').addEventListener('click', function() {
    // Retrieve the PGP key and passphrase from Chrome storage
    chrome.storage.local.get(['pgpKey', 'passphrase'], function(result) {
        if (result.pgpKey) {
            document.getElementById('pgpKey').value = result.pgpKey;
            document.getElementById('passphrase').value = result.passphrase || '';
            document.getElementById('statusMessage').textContent = 'Key loaded successfully!';
        } else {
            document.getElementById('statusMessage').textContent = 'No key found.';
        }
    });
});
