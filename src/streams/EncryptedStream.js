
import {AES} from '../crypto/AES';

export class EncryptedStream {
    constructor(_eventName, _randomized){
        this.eventName = _eventName;
        this.key = _randomized.toString();
        this.event = new Event(_eventName);
        this.synced = false;
    }

    listenWith(func){
        document.addEventListener(this.eventName, (e) => {
            let msg = e.detail;
            msg = (this.synced) ? AES.decrypt(msg, this.key) : msg;
            func(msg);
        });
    }

    send(data, to){
        const addSender = () => { data.from = this.eventName; };
        const encryptIfSynced = () => { data = (this.synced) ? AES.encrypt(data, this.key) : data; };

        return new Promise((resolve, reject) => {
            if(typeof data !== 'object') { reject(); return; }
            addSender();
            encryptIfSynced();
            dispatch(data, to);
            resolve(true);
        })
    }

    sync(to, handshake){
        this.send({type:'sync', handshake}, to).then(res => {
            this.synced = true;
        });

    }



}
//Private
function dispatch(encryptedData, to){ document.dispatchEvent(getEvent(encryptedData, to)); }
function getEvent(encryptedData, to){ return new CustomEvent(to, getEventInit(encryptedData)) }
function getEventInit(encryptedData){ return {detail:encryptedData}; }

