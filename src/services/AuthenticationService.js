import {PasswordHasher} from '../cryptography/PasswordHasher';
import {InternalMessageTypes} from '../messages/InternalMessageTypes';
import {Mnemonic} from '../cryptography/Mnemonic';
import {LocalStream, ScatterData, NetworkMessage} from 'scattermodels'

export class AuthenticationService {

    static authenticate(password, hash){
        return new Promise((resolve, reject) => {
            if(!password.length || !PasswordHasher.validate(password, hash)) {
                reject("Bad password");
                return;
            }

            let [mnemonic, seed] = Mnemonic.generateMnemonic(password);
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.SEED, seed)).then(res => {
                LocalStream.send(NetworkMessage.signal(InternalMessageTypes.UNLOCK)).then(unlocked => {
                    resolve(ScatterData.fromJson(unlocked));
                })
            });
        })
    }

    static create(password, scatter){
        return new Promise((resolve, reject) => {
            if(!password.length || password.length < 8) {
                reject("Bad password");
                return;
            }

            let [mnemonic, seed] = Mnemonic.generateMnemonic(password);
            scatter.data.hash = PasswordHasher.hash(password);
            LocalStream.send(NetworkMessage.payload(InternalMessageTypes.SEED, seed)).then(res => {
                ScatterData.update(scatter).then(saved => {
                    let updatedScatter = ScatterData.fromJson(saved);
                    resolve({scatter:updatedScatter, mnemonic});
                })
            });
        })
    }

}