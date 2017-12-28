import {AES} from '../crypto/AES';
import {ScatterData} from '../models/scatter';
import SHA256 from "crypto-js/sha256";

const WATERFALL_TAG    =   '[W|A|T|E|R|F|A|L|L]';
/***
 * Waterfall encryption
 */
export class WaterfallEncryption {


    /***
     * @param cleartext - A json object or string
     * @param passkey - the key to unlock
     * @param algorithm - a function for hashing which takes cleartext and a key
     * @returns Tupl[Hash, Checksum] || null if below 100 characters (consider padding(?))
     */
    static encrypt(cleartext, passkey, algorithm){
        let temp = Object.assign({}, cleartext);

        // Always convert to string
        if(typeof temp === 'object') temp = JSON.stringify(temp);

        // Exit on less than 100 bytes ( low entropy )
        if(temp.length < 100) return null;

        let segments = stringToChunks(temp);
        let rootSegment = segments.shift();
        let rootHash = algorithm(rootSegment, passkey);

        let waterfallHashes = [];
        segments.map(segment => waterfallHashes.push(algorithm(segment, (!waterfallHashes.length) ? rootHash : waterfallHashes[waterfallHashes.length-1] + passkey)));

        let rehashedRoot = algorithm(rootHash, waterfallHashes[waterfallHashes.length-1] + passkey);
        let joins = rehashedRoot + " " + waterfallHashes.join(" ")+WATERFALL_TAG;
        return algorithm(joins, passkey);

    }

    /***
     * @param cyphertext - an array of cyphers
     * @param passkey - the key to unlock
     * @param algorithm - a function for hashing which takes cleartext and a key
     */
    static decrypt(cyphertext, passkey, algorithm){
        let unencrypted = algorithm(cyphertext, passkey);
        if(unencrypted.indexOf(WATERFALL_TAG) === -1) return null;
        let segments = unencrypted.replace(WATERFALL_TAG,"").split(" ");

        let root = segments.shift();
        const clearRootHash = algorithm(root, segments[segments.length-1] + passkey);
        const clearRoot =  algorithm(clearRootHash, passkey);

        let clearWaterfall = [];
        for(let i=0; i < segments.length; i++){
            const lastkey = i===0 ? clearRootHash : segments[i-1] + passkey;
            clearWaterfall.push(algorithm(segments[i], lastkey));
        }

        return clearRoot + clearWaterfall.join("");
    }
}

function stringToChunks(string, desiredChunks = 10, bytesPerChunk = 0, acc = []){
    if(bytesPerChunk === 0) bytesPerChunk = Math.floor(string.length / desiredChunks);
    if(acc.length===desiredChunks) {
        acc[acc.length-1] += string;
        return acc;
    }
    else {
        acc.push(string.slice(0, bytesPerChunk));
        return stringToChunks(string.substr(bytesPerChunk), desiredChunks, bytesPerChunk, acc)
    }
}


