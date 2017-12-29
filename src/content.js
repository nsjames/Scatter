import { EncryptedStream } from './streams/EncryptedStream';
import {RandomKeyGen} from './cryptography/RandomKeyGen';
import {AES} from './cryptography/AES';
let stream = new WeakMap();
class ContentScript {
    constructor(){
        stream = new EncryptedStream("scatter", RandomKeyGen.generate(12));
        stream.listenWith((msg) => this.contentListener(msg));
        this.injectScript('inject.js');
    }

    contentListener(msg){
        if(!stream.synced && (!msg.hasOwnProperty('type') || msg.type !== 'sync')) { stream.send({type:'error'}, "mal-warn"); return; }

        switch(msg.type){
            case 'sync':
                stream.key = msg.handshake.length ? msg.handshake : null;
                stream.synced = true;
                break;
            case 'sign':
                console.log("Got sign request: ", msg);
                stream.send({type:'signed', signature:'ASFDKJDSKFJ'}, "injected")
                break;
            default:
                console.log("Default", msg, stream.key)
                stream.send({type:'from default content script switch'}, "injected")
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








