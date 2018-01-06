import {KeyPair} from 'scattermodels';
import {Mnemonic} from './Mnemonic';
import {PrivateKey} from 'eosjs-ecc';

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
        return PrivateKey.isValid(privateKey);
    }

}