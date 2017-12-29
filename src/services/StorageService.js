import {ScatterData} from '../models/scatter'
import {Keychain} from '../models/keychain';
import {PasswordHasher} from '../cryptography/PasswordHasher';

export class StorageService {

    static save(scatter, seed){
        return new Promise((resolve, reject) => {
            chrome.storage.local.set({scatter}, () => {
                resolve(scatter);
            });
        })
    };

    static get() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('scatter', (possible) => {
                (possible && Object.keys(possible).length && possible.hasOwnProperty('scatter'))
                    ? resolve(ScatterData.fromJson(possible.scatter))
                    : resolve(ScatterData.placeholder());
            });
        })

    }

    static registerChangeListener(){
        chrome.storage.local.onChanged.addListener(function(changes, namespace) {
            console.log("Storage Modified", changes, namespace)
            // Let's add a listener which alerts the user when
            // something has changed without permission
        });
    }

}