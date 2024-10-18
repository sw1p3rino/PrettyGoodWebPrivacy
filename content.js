const targetWord = "-----BEGIN PGP MESSAGE-----"; // Change this to your target word
const beginWord = "-----BEGIN PGP MESSAGE-----"; // Target word to search for PGP messages
const endWord = "-----END PGP MESSAGE-----"; // End of PGP message
let privateKeyArmored = '';
let passphrase = '';

// Function to retrieve the private key and passphrase
const retrieveKeys = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['pgpKey', 'passphrase'], function(result) {
            if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
            }
            // Assign retrieved values to global variables
            privateKeyArmored = result.pgpKey || ''; // Fallback to an empty string if not found
            passphrase = result.passphrase || '';     // Fallback to an empty string if not found

            resolve();
        });
    });
};



const extractPGPEncryptedMessages = (text) => {
    const messages = [];
    const regex = new RegExp(`${targetWord}[\\s\\S]*?${endWord}`, "gi"); // Regex to match PGP messages

    let match;
    while ((match = regex.exec(text)) !== null) {
        messages.push(match[0]); // Add the matched PGP message to the array
    }
    return messages; // Return all extracted messages 
};



//HTML!!!!Message extraction code
const extractPGPEncryptedHtmlMessages = () => {
    const messages = [];
    const pgpHtmlRegex = /-----BEGIN PGP MESSAGE-----[\s\S]*?-----END PGP MESSAGE-----/g;
    const bodyHTML = document.body.innerHTML;
    const pgpHtmlMessages = bodyHTML.match(pgpHtmlRegex);
    return pgpHtmlMessages || [];
};




// Create a MutationObserver to watch for changes in the DOM
const observer = new MutationObserver((mutationsList) => {
    let mutationText = '';
    for (const mutation of mutationsList) {
        // Only check for newly added nodes or modifications
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            mutationText += mutation.target.textContent;
        }
    }
    if (mutationText.includes(targetWord)) {
        debounce(MainFuction, 1000)(mutationText); // Run the check when a change is detected
    }
});



//Wrapper function for the decrypted text in order to make it more pretty
const wrapDecryptedHtmlMessage = (decryptedMessage) => { //TODO This cuts of a part of the pgpmessage which i need to do in order to prevent infinite loops
    Wrap = "\n" + "----------DECRYPTED----------" + "\n" + decryptedMessage + "\n" + "----------DECRYPTED----------";
    return Wrap;
}



//Text replacement function as changes to the HTML trigger refreshes ==> infinite loops
const replacePGPMessage = (encryptedMessage, decryptedMessage) => {
    let replaced = false;
    
    // Find the text node that contains the PGP message
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                return node.nodeValue.includes(encryptedMessage)
                    ? NodeFilter.FILTER_ACCEPT
                    : NodeFilter.FILTER_REJECT;
            }
        }
    );

    // Replace the text within the node itself without modifying the full HTML
    while (walker.nextNode()) {
        const originalText = walker.currentNode.nodeValue;
        const newText = originalText.replace(encryptedMessage, decryptedMessage);
        if (newText !== originalText) {
            walker.currentNode.nodeValue = newText;
            replaced = true; // Mark as replaced
        }
    }

    return replaced; // Return true if anything was replaced, otherwise false
};



const MainFuction = async (text) => {
    if (text.includes(targetWord)) {
        const pgpMessages = extractPGPEncryptedMessages(text);
        const pgpHtmlMessages = extractPGPEncryptedHtmlMessages();
        do {
            let bodyHTML = document.body.innerHTML;

            //Removes a message from the array
            singlePGPmessage = pgpMessages.shift()
            singleHtmlPGPmessage = pgpHtmlMessages.shift()
           
            //diconnect observer in order to prevent infinite loops triggered through change
            observer.disconnect();
            console.log('Private Key:', privateKeyArmored);
            console.log('Passphrase:', passphrase);
            try {
                // Call the retrieval function
                await retrieveKeys();
                 //decrypt the shit and replace the encrypted with the decrypted message
                const decryptedMessage = await decryptPGPMessage(singlePGPmessage, privateKeyArmored, passphrase);
                
                //Here if no html is included
                const newHTML = bodyHTML.replace(singlePGPmessage, decryptedMessage);
                SomethingWasReplaced = replacePGPMessage(singlePGPmessage, decryptedMessage);
                if (!SomethingWasReplaced) { //Checks if something was replaced. If not the inferior html replacement technique below is used
                    const phpHtmllines = singlePGPmessage.split('\n');
                    const phpHtmlstring = phpHtmllines[phpHtmllines.length - 2].slice(0,10);
                    let wrap = wrapDecryptedHtmlMessage(decryptedMessage);
                    replacePGPMessage(phpHtmlstring, wrap);
                    SomethingWasReplaced = false
                }
            } catch (error) {
                console.error("Error decrypting message:", error);
            }
            observer.observe(document.body, { childList: true, subtree: true, attributes: false });
            
        } while (pgpMessages.length > 0); //loop performs until array is empty ==> everything is decrypted
    }
};



// Debounce function in order to prevent extreme cases of loops
const debounce = (func, delay) => {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), delay);
    };
};



// Run MainFuction on the initial load
MainFuction(document.body.textContent);



// Start observing the body for changes
observer.observe(document.body, { childList: true, subtree: true, attributes: false });

