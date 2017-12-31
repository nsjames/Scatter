# Scatter - Chrome wallet


Scatter is an in-browser wallet for **[EOS](https://eos.io/)** which facilitates interaction between users and dapps.

The extension keeps a user's private keys inside of an encrypted storage in a background process attached to their browser that is inaccessible to the website it interacts with. A few secure methods are *exposed* to the website being visited via injected javascript that allow them to request the signing of transactions on the user's behalf, all of which must be manually approved by the user.

Streams from the website to the extension are encrypted with a randomized key for each session.



---


### Trello board.

I've set up a [Trello board](https://trello.com/b/lP7Sj6eA) for tracking issues and feature requests which is open to the public.
**Please be kind to the board.**

--------------

### If you would like to just download and install the plugin's current build [you can do so here](https://github.com/nsjames/Scatter/raw/master/dev-build.zip)

**Setting it up is simple.**
* Extract the contents of the zip-file to somewhere on your computer
* Open up `chrome://extensions/` in your browser
* Click the `Load unpacked extension...` button and point it at the folder.

-------



### Dependencies:
`npm i -g gulp-cli`


`npm i babel-preset-es2015 babel-preset-stage-2`


To build into the /build/ directory run `gulp run`
_( watchers are kind of screwed up at the moment, you might have to use `gulp build` instead )_

Then set your load the unpacked extension in chrome with the method above.

------

### Usage example for the interacting webpage

_I'm going to use vanilla js and **ES6** syntax just for clarity._


```
// Waiting for the script to be injected:
document.addEventListener("scatterLoaded", () => {
	// Do work here...
});

----------------------------

// Subscribing to messages ( This should only be called once )
// This method is built so you can inject it with a custom message handler.
window.scatter.subscribe(message => {
	switch(msg.type){
    	case 'SIGN_MSG':
        	// Do work here
        	break;
    }
})

----------------------------

// Getting the default Public Key of the user's currently open wallet.
window.scatter.getPublicKey().then(key => {
	if(key){
    	// User has an open wallet
    }
    else {
    	// Display a message to the user to open their wallet.
        // You can poll this method for results.
    }
})
```




