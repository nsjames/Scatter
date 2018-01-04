import {StorageService} from './services/StorageService'
import {ScatterData, LocalStream, WaterfallEncryption, AES, NetworkMessage, NetworkMessageTypes} from 'scattermodels'
import {InternalMessageTypes} from './messages/InternalMessageTypes';

// Does not persist past sessions intentionally.
let seed = '';



export class Background {

    constructor(){
        LocalStream.watch((request, sendResponse) => {
            console.log(request);
            let message = NetworkMessage.fromJson(request);
            switch(request.type){
                case InternalMessageTypes.SEED: Background.setSeed(sendResponse, request.payload); break;
                case InternalMessageTypes.LOAD: Background.load(sendResponse); break;
                case InternalMessageTypes.OPEN: Background.open(sendResponse, request.payload); break;
                case InternalMessageTypes.LOCK: Background.lock(sendResponse); break;
                case InternalMessageTypes.IS_LOCKED: Background.isLocked(sendResponse); break;
                case InternalMessageTypes.REQUEST_UNLOCK: Background.requestUnlock(sendResponse); break;
                case InternalMessageTypes.UNLOCK: Background.unlock(sendResponse); break;
                case InternalMessageTypes.KEYCHAIN: Background.keychain(sendResponse); break;
                case InternalMessageTypes.PUBLIC_TO_PRIVATE: Background.publicToPrivate(sendResponse, request.payload); break;
                case InternalMessageTypes.UPDATE: Background.update(sendResponse, request.payload); break;

                case InternalMessageTypes.PROMPT_AUTH: Background.promptAuthorization(sendResponse, request.payload); break;
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

    static requestUnlock(sendResponse){
        if(seed.length !== 0) this.isLocked(sendResponse);
        else Background.openPrompt(InternalMessageTypes.REQUEST_UNLOCK, {responder:sendResponse});
    }

    static keychain(sendResponse){
        StorageService.get().then(scatter => {
            scatter = this.decrypt(scatter);
            sendResponse(scatter);
        });
    }

    static publicToPrivate(sendResponse, publicKey){
        StorageService.get().then(scatter => {
            scatter = this.decrypt(scatter);
            let keys = scatter.data.keychain.wallets.map(x => x.keyPairs).reduce((a,b) => a.concat(b), []);
            let possiblePrivateKey = keys.find(x => x.publicKey === publicKey);
            if(possiblePrivateKey) sendResponse(possiblePrivateKey.privateKey);
            else sendResponse(null)
        })
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



    static promptAuthorization(sendResponse, message){
        console.log('prompt', message);
        Background.openPrompt(InternalMessageTypes.PROMPT_AUTH, {
            responder:sendResponse,
            network:message.network,
            transaction:message.payload.transaction,
            permission:message.payload.permission,
            allowedAccounts:(message.payload.hasOwnProperty('allowedAccounts')) ? message.payload.allowedAccounts : null
        }, 600);
    }





    static decrypt(scatter){
        scatter = ScatterData.fromJson(scatter);
        scatter.data.keychain.wallets.map(x => {
            x.decrypt(seed);
        });
        return scatter;
    }

    static openPrompt(type, payload = {}, height = 500){
        let rightmost = window.screen.availWidth-5;
        let popup = window.open(chrome.runtime.getURL('prompt.html'), 'ScatterPrompt', `width=360,resizable=0,height=${height},dependent=true,top=50,left=${rightmost}`);
        popup.scatterPrompt = { type, payload };

    }
}

export const background = new Background();


