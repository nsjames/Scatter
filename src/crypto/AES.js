import CryptoJS from "crypto-js";

export class AES {

    static encrypt(data, key){
        return CryptoJS.AES.encrypt(JSON.stringify(data), key).toString()
    }

    static decrypt(encryptedData, key){
        return JSON.parse(CryptoJS.AES.decrypt(encryptedData, key).toString(CryptoJS.enc.Utf8));
    }
}