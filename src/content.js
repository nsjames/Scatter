import { EncryptedStream, LocalStream, AES, RandomIdGenerator, NetworkMessageTypes,
    NetworkMessage, ScatterError, ContractTransaction, Network } from 'scatterhelpers';
import {InternalMessageTypes} from './messages/InternalMessageTypes';
import Eos from 'eosjs';
import ecc from 'eosjs-ecc';

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
        let script = document.createElement('script');
        script.src = chrome.extension.getURL('inject.js');
        (document.head||document.documentElement).appendChild(script);
        script.onload = function() { script.remove(); };
    }

    contentListener(msg){
        if(!webStream.synced && (!msg.hasOwnProperty('type') || msg.type !== 'sync')) { webStream.send({type:'error'}, "mal-warn"); return; }
        let nonSyncMessage = NetworkMessage.fromJson(msg);

        switch(msg.type){
            case 'sync': this.sync(msg); break;
            case NetworkMessageTypes.REQUEST_IDENTITY: this.requestIdentity(nonSyncMessage); break;
            case NetworkMessageTypes.PROVE_IDENTITY: this.proveIdentity(nonSyncMessage); break;
            case NetworkMessageTypes.REQUEST_SIGNATURE: this.sign(nonSyncMessage); break;
            case NetworkMessageTypes.SIGN_WITH_ANY: this.signWithAnyAccount(nonSyncMessage); break;

            default: this.rejectWithError(nonSyncMessage.error(new ScatterError('bad_msg', 'No such message can be parsed')))
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

    identityGuard(message){
        return new Promise((resolve, reject) => {
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PROMPT_IDENTITY, message)).then(publicKey => {
                if(typeof publicKey !== 'undefined' && publicKey) { resolve(publicKey); return; }
                this.rejectWithError(message.error(new ScatterError("not_authorized", "The user did not authorize the provision of identity.")), reject);
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

    reclaimAccount(){ LocalStream.send(NetworkMessage.signal(InternalMessageTypes.RECLAIM)) }




    requestIdentity(message){
        this.lockGuard(message).then(locked => {
            setTimeout(() => {
                this.identityGuard(message).then(identity => {
                    // TODO: Change to support user selected account
                    this.respond(message, {name:identity.accounts[0].name, publicKey:identity.publicKey});
                }).catch(() => {})
            }, 100)
        }).catch(() => {});
    }

    proveIdentity(message){
        this.lockGuard(message).then(locked => {
            const publicKey = message.payload.publicKey;
            const random = message.payload.random;
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PROVE_IDENTITY, {publicKey, random})).then(encrypted => {
                console.log(encrypted);
                this.respond(message, 'NOT YET IMPLEMENTED');
            }).catch(e => { this.rejectWithError(message.error(new ScatterError('bad_key', "Couldn't fetch key"))) })
        }).catch(() => {});
    }





    sign(message){
        let allowedAccounts = message.payload.transaction.messages.map(x => x.authorization).reduce((a,b) => a.concat(b), []);
        console.log(allowedAccounts);
        this.lockAndSignGuard(message, allowedAccounts).then(keyPair => {
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, keyPair.publicKey)).then(privateKey => {
                if(!privateKey) {
                    this.rejectWithError(message.error(new ScatterError("private_key", "The user tried using an invalid private key.")));
                    return;
                }

                let signed = ecc.sign(new Buffer(message.payload.buf.data), privateKey);
                this.respond(message, [signed]);
                this.reclaimAccount();
            }).catch(e => { this.rejectWithError(message.error(new ScatterError('bad_key', "Couldn't fetch key"))) })
        })

    }

    signWithAnyAccount(message){
        let trx = Object.assign({}, message.payload);
        message.payload = {transaction:trx}

        this.lockAndSignGuard(message).then(keyPair => {
            let network = Network.fromJson(message.network);
            let transaction = message.payload;

            // TODO: Allow user to select authority
            let account = keyPair.accounts.find(x => x.authority === 'active');
            if(!account) {
                this.rejectWithError(message.error(new ScatterError('no_account', "The key the user selected doesn't belong to an account yet")));
                return;
            }

            ContractTransaction.replaceScatterProps(trx, account);

            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, keyPair.publicKey)).then(privateKey => {
                if(!privateKey) {
                    this.rejectWithError(message.error(new ScatterError("private_key", "The user tried using an invalid private key.")));
                    return;
                }

                //TODO Add support for multi message transactions
                let eos = Eos.Localnet({httpEndpoint:network.toEndpoint(), keyProvider:privateKey});
                let contractMessage = trx.messages[0];
                eos.contract(contractMessage.code).then(contract => {
                    contract.transaction(trx)
                        .then(transaction => {
                            this.respond(message, transaction);
                            this.reclaimAccount();
                        })
                        .catch(e => { this.rejectWithError(message.error(new ScatterError('trx_error', e))) })
                }).catch(e => { this.rejectWithError(message.error(new ScatterError('no_contract', "Couldn't fetch contract with code: " + contractMessage.code))) });
            }).catch(e => { this.rejectWithError(message.error(new ScatterError('bad_key', "Couldn't fetch private key"))) });
        });
    }


    respond(message, payload){ webStream.send(message.respond(payload), "injected"); }
    rejectWithError(err, reject = null){ webStream.send(err, "injected"); if(reject) reject(err); }

}

const contentScript = new ContentScript();








