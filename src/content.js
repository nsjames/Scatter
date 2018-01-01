import { EncryptedStream, LocalStream, AES, RandomIdGenerator, MessageTypes, Message } from 'scattermodels';

let webStream = new WeakMap();
let internalStream = new WeakMap();
class ContentScript {
    constructor(){
        webStream = new EncryptedStream("scatter", RandomIdGenerator.generate(12));
        webStream.listenWith((msg) => this.contentListener(msg));

        internalStream = new LocalStream();

        this.injectScript('inject.js');
    }

    // TODO: Move logic into an actual handler
    contentListener(msg){
        console.log("Got message", msg, webStream.synced);

        // Dont allow non-sync before sync
        if(!webStream.synced && (!msg.hasOwnProperty('type') || msg.type !== 'sync'))
            { webStream.send({type:'error'}, "mal-warn"); return; }

        let scatterMessage = Message.fromJson(msg);

        switch(msg.type){
            case 'sync':
                webStream.key = msg.handshake.length ? msg.handshake : null;
                webStream.synced = true;
                webStream.send({type:'sync'}, "injected");
                break;
            case MessageTypes.REQUEST_PERMISSIONS:
                webStream.send(scatterMessage.respond('hello world'), "injected");
                break;
            default:
                console.log("Default", msg, webStream.key)
                webStream.send({type:'default'}, "injected")
        }
    }

    injectScript(fullpathfile){
        let s = document.createElement('script');
        s.src = chrome.extension.getURL(fullpathfile);
        (document.head||document.documentElement).appendChild(s);
        s.onload = function() {
            s.remove();
        };
    }
}

const contentScript = new ContentScript();








