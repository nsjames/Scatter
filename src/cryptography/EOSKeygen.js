import {Mnemonic} from '../cryptography/Mnemonic';
import {PrivateKey} from 'eosjs-ecc';
import {KeyPair} from '../models/keypair'

export class EOSKeygen {

    static generateKeys(){
        let [mnemonic, seed] = Mnemonic.generateDanglingMnemonic();
        let privateKey = EOSKeygen.generatePrivateKey(seed);
        let publicKey = EOSKeygen.privateToPublic(privateKey);
        return KeyPair.fromJson({publicKey, privateKey})
    }

    static generatePrivateKey(seed) {
        return PrivateKey.fromSeed(seed).toWif()
    }

    static privateToPublic(privateKey) {
        return PrivateKey.fromWif(privateKey).toPublic().toString()
    }

    static validPrivateKey(privateKey){
        console.log(privateKey);
        return PrivateKey.isValid(privateKey);
    }

}