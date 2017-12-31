import { EncryptedStream } from '../streams/EncryptedStream';
import EOSMessageTypes from './EOSMessageTypes';


let stream = new WeakMap();
export class InjectedEOS {
    constructor(handshake){
        this.ext = "scatter";
        stream = new EncryptedStream("injected", handshake);
        stream.sync(this.ext, handshake)
    }

    getPublicKey(){
        return new Promise((resolve, reject) => {
            stream.send({type:EOSMessageTypes.GET_PUBLIC_KEY}, this.ext);
            resolve(true);
        });
    }

    sign(msg){
        return new Promise((resolve, reject) => {
            stream.send({type:EOSMessageTypes.SIGN_MSG, msg}, this.ext);
            resolve(true);
        });

    }

    subscribe(func){
        stream.listenWith(func);
    }

}
