import {StorageService} from './services/StorageService'
import {ScatterData, LocalStream, WaterfallEncryption, AES, Message, MessageTypes} from 'scattermodels'
import {InternalMessageTypes} from './messages/InternalMessageTypes';

// Does not persist past sessions intentionally.
let seed = '';



export class Background {

    constructor(){
        LocalStream.watch((request, sendResponse) => {
            console.log(request);
            let message = Message.fromJson(request);
            switch(request.type){
                case InternalMessageTypes.SEED: Background.setSeed(sendResponse, request.payload); break;
                case InternalMessageTypes.LOAD: Background.load(sendResponse); break;
                case InternalMessageTypes.OPEN: Background.open(sendResponse, request.payload); break;
                case InternalMessageTypes.LOCK: Background.lock(sendResponse); break;
                case InternalMessageTypes.IS_LOCKED: Background.isLocked(sendResponse); break;
                case InternalMessageTypes.UNLOCK: Background.unlock(sendResponse); break;
                case InternalMessageTypes.KEYCHAIN: Background.keychain(sendResponse); break;
                case InternalMessageTypes.UPDATE: Background.update(sendResponse, request.payload); break;
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

    static open(sendResponse, name){
        StorageService.get().then(scatter => {
            scatter.data.keychain.wallets.map(x => x.lastOpened = false);
            scatter.data.keychain.wallets.find(x => x.name === name).lastOpened = true;
            sendResponse(scatter);
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