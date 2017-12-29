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
                case 'seed': Background.seed(sendResponse, request.seed); break;
                case 'load': Background.load(sendResponse); break;
                case 'lock': Background.lock(sendResponse); break;
                case 'unlock': Background.unlock(sendResponse); break;
                case 'keychain': Background.unlock(sendResponse); break;
                case 'update-settings': Background.updateSettings(sendResponse, request.scatter); break;
                case 'update-keychain': Background.updateKeychain(sendResponse, request.scatter); break;
                case 'reset': chrome.storage.local.clear(); sendResponse({}); break;
                // default: sendResponse(null);
            }
        })
    }

    static seed(sendResponse, s){ seed = s; sendResponse(); }

    static load(sendResponse){
        StorageService.get().then(scatter => {
            sendResponse(scatter)
        })
    }

    static unlock(sendResponse){
        StorageService.get().then(scatter => {
            scatter.unlock(seed);
            StorageService.save(scatter).then(saved => {
                sendResponse(scatter);
            })
        })
    }
    static lock(sendResponse){
        StorageService.get().then(scatter => {
            scatter.lock(seed);
            StorageService.save(scatter).then(saved => {
                sendResponse(scatter);
            })
        })
    }
    static keychain(sendResponse){
        StorageService.get().then(scatter => {
            sendResponse(WaterfallEncryption.decrypt(scatter.data.keychain, seed, AES.decrypt));
        });
    }

    static updateSettings(sendResponse, scatter){
        StorageService.get().then(persistent => {
            scatter.data.keychain = persistent.data.keychain
            StorageService.save(scatter).then(saved => {
                sendResponse(scatter)
            })
        })

    }

    static updateKeychain(sendResponse, scatter){
        StorageService.get().then(persistent => {
            console.log('persistent', persistent)
            persistent.data.keychain = WaterfallEncryption.encrypt(scatter.data.keychain, seed, AES.encrypt);
            StorageService.save(persistent).then(saved => {
                sendResponse(persistent)
            })
        })
    }
}

export const background = new Background();