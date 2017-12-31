import {StorageService} from './services/StorageService'
import {ScatterData} from './models/scatter'
import {LocalStream} from './streams/LocalStream';
import {WaterfallEncryption} from './cryptography/WaterfallEncryption';
import {AES} from './cryptography/AES';

// Not actually sure if I need you yet bro.
let scatterData = new WeakMap();
let localStream = new WeakMap();
let seed = '';

//TODO: Fill with genesis data
let genesis = {};
export class Background {

    constructor(){
        LocalStream.watch((request, sendResponse) => {
            switch(request.msg){
                case 'seed': Background.setSeed(sendResponse, request.seed); break;
                case 'load': Background.load(sendResponse); break;
                case 'lock': Background.lock(sendResponse); break;
                case 'locked?': Background.isLocked(sendResponse); break;
                case 'unlock': Background.unlock(sendResponse); break;
                case 'keychain': Background.keychain(sendResponse); break;
                case 'update': Background.update(sendResponse, request.scatter); break;
                case 'reset': chrome.storage.local.clear(); sendResponse({}); break;
                // default: sendResponse(null);
            }
        })
    }

    static setSeed(sendResponse, s){ seed = s; sendResponse(); }

    static load(sendResponse){
        StorageService.get().then(scatter => {
            sendResponse(scatter)
        })
    }

    static unlock(sendResponse){
        StorageService.get().then(scatter => {
            scatter.unlock();
            StorageService.save(scatter).then(saved => {
                sendResponse(scatter);
            })
        })
    }

    static lock(sendResponse){
        StorageService.get().then(scatter => {
            scatter.lock();
            StorageService.save(scatter).then(saved => {
                seed = '';
                sendResponse(scatter);
            })
        })
    }

    static isLocked(sendResponse){
        sendResponse(seed.length === 0)
    }

    static keychain(sendResponse){
        StorageService.get().then(scatter => {
            scatter = ScatterData.fromJson(scatter);
            scatter.data.keychain.wallets.map(x => {
                x.decrypt(seed);
            });
            sendResponse(scatter);
        });
    }

    static update(sendResponse, scatter){
        // StorageService.get().then(persistent => {
        //
        // })
        //TODO: Only update editable things, to preserve integrity
        scatter = ScatterData.fromJson(scatter);
        scatter.data.keychain.wallets.map(x => {
            x.prepareForSaving();
            x.encrypt(seed);
        });
        StorageService.save(scatter).then(saved => {
            sendResponse(scatter)
        })
    }
}

export const background = new Background();