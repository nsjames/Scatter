import { EncryptedStream } from '../streams/EncryptedStream';


let stream = new WeakMap();
export class InjectedEOS {
    constructor(handshake){
        this.ext = "scatter";
        stream = new EncryptedStream("injected", handshake);
        stream.sync(this.ext, handshake)
    }

    sign(msg){
        return new Promise((resolve, reject) => {
            stream.send({type:'sign', msg}, this.ext)
            resolve(true);
        });

    }

    subscribe(func){
        stream.listenWith(func);
    }

}
