import {StorageService} from './services/StorageService'
import {ScatterData, LocalStream, AES, NetworkMessage, NetworkMessageTypes} from 'scattermodels'
import {InternalMessageTypes} from './messages/InternalMessageTypes';
import {AccountService} from './services/AccountService'

// Does not persist past sessions intentionally.
let seed = '';

export class Background {

    constructor(){
        LocalStream.watch((request, sendResponse) => {
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
                case InternalMessageTypes.PROMPT_IDENTITY: Background.promptIdentity(sendResponse, request.payload); break;
                case InternalMessageTypes.PROVE_IDENTITY: Background.proveIdentity(sendResponse, request.payload); break;
                case InternalMessageTypes.RECLAIM: Background.reclaim(sendResponse); break;
                case InternalMessageTypes.DESTROY_KEYCHAIN: Background.destroyKeychain(sendResponse); break;
                // default: sendResponse(null);
            }
        })
    }

    static setSeed(sendResponse, s){ seed = s; sendResponse(); }

    static load(sendResponse){
        StorageService.get().then(scatter => {
            console.log(scatter)
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
        console.log('updating', scatter);
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
        Background.openPrompt(InternalMessageTypes.PROMPT_AUTH, {
            responder:sendResponse,
            network:message.network,
            transaction:message.payload.transaction,
            permission:message.payload.permission,
            allowedAccounts:(message.payload.hasOwnProperty('allowedAccounts')) ? message.payload.allowedAccounts : null
        }, 600);
    }

    static promptIdentity(sendResponse, message){
        Background.openPrompt(InternalMessageTypes.PROMPT_IDENTITY, {
            responder:sendResponse,
            network:message.network,
            location:message.payload.location
        }, 600);
    }

    static proveIdentity(sendResponse, message){

        sendResponse(null);
    }

    /***
     * Happens every time a user sends coins.
     * If there is an unreclaimed account lingering it will be paid for.
     * @param sendResponse
     */
    static reclaim(sendResponse){
        //TODO: Send notification about reclaiming ( from background to ui, needs to be persisted to queue for next time the extension is open )
        StorageService.get().then(scatter => {
            let keyPair = scatter.data.keychain.wallets.map(x => x.keyPairs).reduce((a,b) => a.concat(b), []).find(x => !x.reclaimed);
            if(keyPair && keyPair.accounts.length){
                this.publicToPrivate((privateKey) => {
                    if(!privateKey) {
                        console.warn('Something is wrong with private key encryption');
                        return false;
                    }

                    AccountService.reclaim(keyPair.accounts[0], privateKey, keyPair.network)
                        .then(reclaimed => {
                            if(reclaimed) {
                                keyPair.reclaimed = true;
                                Background.update(sendResponse, scatter);
                            }
                            else sendResponse(false);
                        })
                        .catch(x => sendResponse(false))
                }, keyPair.publicKey)
            } else sendResponse(false);
        })
    }


    static destroyKeychain(sendResponse){
        chrome.storage.local.clear();
        seed = '';
        sendResponse({});
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
        console.log(type, payload);
        popup.scatterPrompt = { type, payload };

    }
}

export const background = new Background();


