import CryptoJS from "crypto-js";

export class AES {

    static encrypt(data, key){
        if(typeof data === 'object') data = JSON.stringify(data);
        return CryptoJS.AES.encrypt(data, key).toString()
    }

    static decrypt(encryptedData, key){
        let clear = CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8);
        try { return JSON.parse(clear) } catch(e){ return clear; }
    }
}