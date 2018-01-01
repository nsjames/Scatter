import { EncryptedStream, LocalStream, AES, RandomIdGenerator, MessageTypes, Message } from 'scattermodels';

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

        let nonSyncMessage = Message.fromJson(msg);

        switch(msg.type){
            case 'sync': this.sync(msg); break;
            case MessageTypes.REQUEST_PERMISSIONS: this.requestPermissions(nonSyncMessage); break;
            case MessageTypes.PROVE_IDENTITY: this.proveIdentity(nonSyncMessage); break;
            case MessageTypes.REQUEST_SIGNATURE: this.requestSignature(nonSyncMessage); break;
            case MessageTypes.GET_BALANCE: this.getBalance(nonSyncMessage); break;

            default: webStream.send({type:'default'}, "injected")
        }
    }


    sync(message){
        webStream.key = message.handshake.length ? message.handshake : null;
        webStream.synced = true;
        webStream.send({type:'sync'}, "injected");
    }

    requestPermissions(message){
        console.log("requestPermissions", message)
        webStream.send(message.respond('hello world'), "injected");
        LocalStream.send(message)
    }

    proveIdentity(message){
        console.log("proveIdentity")

    }

    requestSignature(message){
        console.log("requestSignature")

    }

    getBalance(message){
        console.log("getBalance")

    }

}

const contentScript = new ContentScript();








