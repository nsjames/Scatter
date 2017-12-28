import {ScatterData} from '../models/scatter'

export class StorageService {

    static save(scatter){
        return chrome.storage.local.set({scatter}, () => {
            return true;
        });
    };

    static get() {
        return new Promise((resolve, reject) => {
            chrome.storage.local.get('scatter', (possible) => {
                let scatter = ScatterData.fromJson(possible);
                resolve(scatter);
            });
        })

    }

    static registerChangeListener(){
        chrome.storage.onChanged.addListener(function(changes, namespace) {
            console.log("Storage Modified", changes, namespace)
            // Let's add a listener which alerts the user when
            // something has changed without permission
        });
    }

}