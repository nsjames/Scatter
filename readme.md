# Scatter - Chrome wallet


Scatter is an in-browser wallet for **[EOS](https://eos.io/)** which facilitates interaction between users and dapps.

The extension keeps a user's private keys inside of an encrypted storage in a background process attached to their browser that is inaccessible to the website it interacts with. A few secure methods are *exposed* to the website being visited via injected javascript that allow them to request the signing of transactions on the user's behalf, all of which must be manually approved by the user.

Streams from the website to the extension are encrypted with a randomized key for each session.




## Trello board.

I've set up a [Trello board](https://trello.com/b/lP7Sj6eA) for tracking issues and feature requests which is open to the public.
**Please be kind to the board.**


### If you would like to just download and install the plugin's current build [you can do so here](https://github.com/nsjames/Scatter/raw/master/scatter.zip)

**Setting it up is simple.**
* Extract the contents of the zip-file to somewhere on your computer
* Open up `chrome://extensions/` in your browser
* Click the `Load unpacked extension...` button and point it at the folder.




## Pre-requisites:

* Webpack is required globally `npm i -g webpack`

This package requires an `npm link` from two packages 
( [Scatterdapp](https://github.com/nsjames/Scatterdapp), 
[Scattermodels](https://github.com/nsjames/Scattermodels) ) 
for the moment until they are hosted on npm. 

( _Scatterdapp is the front-end wrapper around scatter which gets injected into web pages, 
and Scattermodels are just shared resources between the two_ )

1) Make a directory somewhere called `/scatterdapp/`
2) Do `git clone https://github.com/nsjames/Scatterdapp.git` inside the directory
3) While still inside of the `/scatterdapp/` directory do `npm link`
4) **Repeat 1-3 for `https://github.com/nsjames/Scattermodels.git`**
5) Then go to wherever you cloned **Scatter** into and do `npm link scatterdapp scattermodels`


## Building:

Building is now handled by webpack. To build into the `./build` directory simply use `npm run dev` or `webpack`.

Then load the unpacked extension in chrome with the method described above.





### Usage example for the interacting webpage

If you want typings and code completion for the web api you can head over to [Scatterdapp](https://github.com/nsjames/Scatterdapp).

```
// ScatterLoaded happens _after_ encryption syncs.
// window.scatter will be null until encryption occurs
---------------------------------------------------------
document.addEventListener('scatterLoaded', afterLoad)
---------------------------------------------------------
function afterLoad(){
    var scatter = window.scatter;
    //...
}
```
    
#### SETUP

You must define a network that your website uses. A user's accounts will be filtered by the network.
**Failure to set a network will disallow messaging the extension.**
```
var network = new Network("Test Network 1", "testnet1.eos.io", 8888);
window.scatter.setNetwork(network);
```

#### USAGE

There's two ways to have a user sign a transaction.

If you already know the account your used uses, you can inject the account for
them right into `eosjs` and not have to worry about special methods:

```
let eos = Eos.Localnet({httpEndpoint:network.toEndpoint(), signProvider:this.scatter.provider});
```

Then, you can call transactions normally and it will prompt the user through the provider.
```
eos.transfer({from: 'testacc', to: 'inita', amount: 1, memo: ''}).then(result => {
    //..
})
```

Or even your own transaction

```
eos.contract('currency').then(currency => 
    currency.transaction(customTransaction)
        .then...
        .catch... )
```

That's all great, but in a lot of cases it just wont do since you wont know what accounts they have.

For that you can use a scatter method which will push a transaction up to the extension to be signed and sent.
For it to work though we have to do a few things to our transaction object.

```
let transaction = {
    messages: [{
        code: 'currency',
        type: 'transfer',
        authorization: [], // Left out, will be calculated after
        data:{
            from:'[scatter]', // Left out, will be calculated after
            to:'inita',
            quantity:5
        }
    }],
    scope:['inita'], // Leave out the other
    signatures:[]
};
```

As you can see above you can send any transaction you want, and by adding `[scatter]` into a property's value it will autofill
when the user selects an account. 

Once you've prepared your transaction you can send it off to be signed inside of the extension. 

```
window.scatter.signWithAnyAccount(transaction)
    .then...
    .catch...
```

### Check out the [eosjs repo](https://github.com/EOSIO/eosjs) for more information on how to use it to interact 
with the EOS blockchain from javascript.



