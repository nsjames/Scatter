import { EncryptedStream, LocalStream, AES, RandomIdGenerator, NetworkMessageTypes, NetworkMessage, ScatterError } from 'scattermodels';
import {InternalMessageTypes} from './messages/InternalMessageTypes';
import {EOSService} from './services/EOSService'

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
            case NetworkMessageTypes.REQUEST_SIGNATURE: this.requestSignature(nonSyncMessage); break;
            case NetworkMessageTypes.GET_BALANCE: this.getBalance(nonSyncMessage); break;

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

    promptSignatureAuthorization(message){
        return new Promise((resolve, reject) => {
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PROMPT_AUTH, message)).then(accepted => {
                if(typeof accepted !== 'undefined' && accepted) { resolve(true); return; }
                this.rejectWithError(message.error(new ScatterError("not_authorized", "The user did not authorize the signing of this transaction.")), reject);
            })
        })
    }




    requestPermissions(message){
        this.lockGuard(message).then(locked => {
            console.log("requestPermissions", message)
            webStream.send(message.respond('hello world'), "injected");
            // LocalStream.send(message)
        }).catch(() => {});

    }

    proveIdentity(message){
        console.log("proveIdentity")

    }

    requestSignature(message){
        this.lockGuard(message).then(locked => {
            setTimeout(() => {
                this.promptSignatureAuthorization(message).then(authorized => {
                    console.log("APPROVED")
                    // EOSService.abiJsonToBin(message.payload.message.code, message.payload.message.type, message.payload.data).then(binargs => {
                    //     let publicKey = 'EOS7evxmxC21W9gnKbNgzrjMm5AmYLsq9ZDS8y8KMRy3z4QqqpqsD';
                    //     LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, publicKey)).then(privateKey => {
                    //         if(!privateKey) {
                    //             this.rejectWithError(message.error(new ScatterError("private_key",
                    //                 "The user tried using an invalid private key, this is probably a program error.")), null);
                    //             return;
                    //         }
                    //
                    //         let signature = EOSService.sign(binargs, privateKey);
                    //
                    //         let msgbin = Object.assign({}, message.payload.message);
                    //         msgbin.data = binargs;
                    //
                    //
                    //         EOSService.getLatestBlock().then(block => {
                    //             console.log("BLOCK", block)
                    //
                    //             let trx = {
                    //                 refBlockNum:block.block_num,
                    //                 refBlockPrefix:block.ref_block_prefix,
                    //                 expiration:'',
                    //                 scope:[message.payload.data.from, message.payload.data.to],
                    //                 messages:[
                    //                     msgbin
                    //                 ],
                    //                 signatures:[signature]
                    //             };
                    //             console.log("trx: ", trx)
                    //         })
                    //
                    //
                    //     }).catch(e => {
                    //         console.log("CONTENTJS ERROR: ", e)
                    //     })
                    //     // webStream.send(message.respond(message), "injected");
                    // })
                }).catch(() => {})
            }, 100)
        }).catch(() => {});

    }

    getBalance(message){
        console.log("getBalance")

    }




    rejectWithError(err, reject){
        webStream.send(err, "injected");
        if(reject) reject(err);
    }

}

const contentScript = new ContentScript();








