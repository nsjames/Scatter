import { EncryptedStream } from './streams/EncryptedStream';
import { LocalStream } from './streams/LocalStream';
import {RandomKeyGen} from './cryptography/RandomKeyGen';
import {AES} from './cryptography/AES';
import EOSMessageTypes from './eos/EOSMessageTypes';

let webStream = new WeakMap();
let internalStream = new WeakMap();
class ContentScript {
    constructor(){
        webStream = new EncryptedStream("scatter", RandomKeyGen.generate(12));
        webStream.listenWith((msg) => this.contentListener(msg));

        internalStream = new LocalStream();

        this.injectScript('inject.js');
    }

    // TODO: Move logic into an actual handler
    contentListener(msg){
        if(!webStream.synced && (!msg.hasOwnProperty('type') || msg.type !== 'sync'))
            { webStream.send({type:'error'}, "mal-warn"); return; }

        switch(msg.type){
            case 'sync':
                webStream.key = msg.handshake.length ? msg.handshake : null;
                webStream.synced = true;
                break;
            case EOSMessageTypes.GET_PUBLIC_KEY:
                webStream.send({type:'signed', signature:'ASFDKJDSKFJ'}, "injected")
                break;
            case EOSMessageTypes.SIGN_MSG:
                webStream.send({type:'signed', signature:'ASFDKJDSKFJ'}, "injected")
                break;
            default:
                console.log("Default", msg, webStream.key)
                webStream.send({type:'from default content script switch'}, "injected")
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








