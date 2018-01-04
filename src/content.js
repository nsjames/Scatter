import { EncryptedStream, LocalStream, AES, RandomIdGenerator, NetworkMessageTypes,
    NetworkMessage, ScatterError, ContractTransaction, EOSService, Network } from 'scattermodels';
import {InternalMessageTypes} from './messages/InternalMessageTypes';
import Eos from 'eosjs';

let webStream = new WeakMap();
class ContentScript {
    constructor(){
        this.setupStreams();
        this.injectScript();
    }

    setupStreams(){
        webStream = new EncryptedStream("scatter", RandomIdGenerator.generate(12));
        webStream.listenWith((msg) => this.contentListener(msg));
    }

    injectScript(){
        let s = document.createElement('script');
        s.src = chrome.extension.getURL('inject.js');
        (document.head||document.documentElement).appendChild(s);
        s.onload = function() {
            s.remove();
        };
    }

    contentListener(msg){
        if(!webStream.synced && (!msg.hasOwnProperty('type') || msg.type !== 'sync')) { webStream.send({type:'error'}, "mal-warn"); return; }

        let nonSyncMessage = NetworkMessage.fromJson(msg);

        switch(msg.type){
            case 'sync': this.sync(msg); break;
            case NetworkMessageTypes.REQUEST_PERMISSIONS: this.requestPermissions(nonSyncMessage); break;
            case NetworkMessageTypes.PROVE_IDENTITY: this.proveIdentity(nonSyncMessage); break;
            case NetworkMessageTypes.REQUEST_SIGNATURE: this.sign(nonSyncMessage); break;
            case NetworkMessageTypes.SIGN_WITH_ANY: this.signWithAnyAccount(nonSyncMessage); break;

            default: webStream.send({type:'default'}, "injected")
        }
    }



    sync(message){
        webStream.key = message.handshake.length ? message.handshake : null;
        webStream.synced = true;
        webStream.send({type:'sync'}, "injected");
    }


    lockGuard(message){
        return new Promise((resolve, reject) => {
            LocalStream.send(NetworkMessage.signal(InternalMessageTypes.REQUEST_UNLOCK)).then(locked => {
                if(typeof locked !== 'undefined' && !locked) { resolve(true); return; }
                this.rejectWithError(message.error(new ScatterError("locked", "The user's wallet is locked and they refused a request to open it.")), reject);
            })
        })
    }

    signGuard(message, account){
        return new Promise((resolve, reject) => {
            message.payload.allowedAccounts = account;
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PROMPT_AUTH, message)).then(publicKey => {
                if(typeof publicKey !== 'undefined' && publicKey) { resolve(publicKey); return; }
                this.rejectWithError(message.error(new ScatterError("not_authorized", "The user did not authorize the signing of this transaction.")), reject);
            })
        })
    }

    lockAndSignGuard(message, account = null){
        return new Promise((resolve, reject) => {
            this.lockGuard(message).then(locked => {
                setTimeout(() => this.signGuard(message, account).then(publicKey => resolve(publicKey)).catch(e => reject(e)), 100)
            }).catch(e => reject(e));
        });
    }

    requestPermissions(message){
        this.lockGuard(message).then(locked => {
            console.log("requestPermissions", message)
            webStream.send(message.respond('hello world'), "injected");
        }).catch(() => {});

    }

    proveIdentity(message){
        console.log("proveIdentity")
    }


    sign(message){
        let allowedAccounts = message.payload.transaction.messages.map(x => x.authorization).reduce((a,b) => a.concat(b), []);
        this.lockAndSignGuard(message, allowedAccounts).then(keyPair => {
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, keyPair.publicKey)).then(privateKey => {
                if(!privateKey) {
                    this.rejectWithError(message.error(new ScatterError("private_key", "The user tried using an invalid private key.")), null);
                    return;
                }

                let signed = EOSService.sign(new Buffer(message.payload.buf.data), privateKey);
                webStream.send(message.respond([signed]), "injected");
            }).catch(e => { console.log("CONTENTJS ERROR: ", e); webStream.send(message.error(new ScatterError('bad_key', "Couldn't fetch key")), "injected") })
        })

    }

    signWithAnyAccount(message){
        console.log("signWithAnyAccount", message)
        let trx = Object.assign({}, message.payload);
        message.payload = {transaction:trx}

        // TODO: Filter for only keys associated with accounts
        // TODO: Really, all keys should have accounts.
        // TODO: Make scatter able to create and stake accounts
        // To compensate for stake, scatter could allow only 1 generated account at a time
        // and then reclaim the stake after the first transfer from the account.
        this.lockAndSignGuard(message).then(keyPair => {
            let network = Network.fromJson(message.network);
            let transaction = message.payload;

            console.log('keyPair', keyPair)

            let account = keyPair.accounts.find(x => x.authority === 'active');
            if(!account) {
                webStream.send(message.error(new ScatterError('no_account', "The key the user selected doesn't belong to an account yet")), "injected");
                return;
            }

            // TODO: Move this into a transformer
            trx.scope.push(account.name)
            function morphScatterProps(obj){
                Object.keys(obj).map(key => {
                    if(obj[key] === '[scatter]') obj[key] = account.name;
                });
            }
            trx.messages.map(msg => {
                morphScatterProps(msg.data);
                msg.authorization = msg.authorization.concat([{account:account.name, permission:account.authority}])
            });
            morphScatterProps(trx.data);

            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, keyPair.publicKey)).then(privateKey => {
                if(!privateKey) {
                    this.rejectWithError(message.error(new ScatterError("private_key", "The user tried using an invalid private key.")), null);
                    return;
                }

                let eos = Eos.Localnet({httpEndpoint:network.toEndpoint(), keyProvider:privateKey});
                let contractMessage = trx.messages[0];
                eos.abiJsonToBin({code:contractMessage.code, action:contractMessage.type, args:contractMessage.data}).then(bin => {
                    let bintrx = Object.assign({}, trx);
                    trx.messages[0].data = bin.binargs;
                    eos.contract('currency').then(currency => {
                        currency.transaction(bintrx)
                            .then(transaction => { webStream.send(message.respond(transaction), "injected"); })
                            .catch(e => { webStream.send(message.error(new ScatterError('trx_error', e)), "injected") })
                    })
                }).catch(e => { webStream.send(message.error(new ScatterError('abi_error', e)), "injected") })
            }).catch(e => { webStream.send(message.error(new ScatterError('bad_key', "Couldn't fetch key1")), "injected") });
        });
    }


    messageToSignedTransaction(message, privateKey){
        console.log(message);
        return new Promise((resolve, reject) => {
            let eos = new EOSService(Network.fromJson(message.network).toEndpoint())

            //TODO theres a disconnect between `message` and `messages`
            eos.abiJsonToBin(message.payload.transaction.messages[0].code, message.payload.transaction.messages[0].type, message.payload.transaction.data).then(binargs => {
                let signature = eos.sign(binargs, privateKey);
                resolve(signature)
            }).catch(e => {
                console.log("Error: ", e)
                reject(false)
            })
        })
    }



    rejectWithError(err, reject){
        webStream.send(err, "injected");
        if(reject) reject(err);
    }

}

const contentScript = new ContentScript();








