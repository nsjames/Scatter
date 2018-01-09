import {ScatterData} from 'scatterhelpers'

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

}