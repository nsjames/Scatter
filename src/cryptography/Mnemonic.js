import {PasswordHasher} from "./PasswordHasher";
import bip39 from 'bip39'

export class Mnemonic {
    static generateMnemonic(password) {
        const hash = PasswordHasher.hash(password);
        let mnemonic = bip39.entropyToMnemonic(hash);
        return [mnemonic, bip39.mnemonicToSeedHex(mnemonic)];
    }

    static generateDanglingMnemonic() {
        let mnemonic = bip39.generateMnemonic();
        return [mnemonic, bip39.mnemonicToSeedHex(mnemonic)];
    }

    static mnemonicPasses(mnemonic, seed) {
        if(!bip39.validateMnemonic(mnemonic)) return false;
        return bip39.mnemonicToSeedHex(mnemonic) === seed
    }

    static mnemonicPassesFromPassword(password, seed) {
        const hash = PasswordHasher.hash(password);
        let mnemonic = bip39.entropyToMnemonic(hash);
        if(!bip39.validateMnemonic(mnemonic)) return false;
        return bip39.mnemonicToSeedHex(mnemonic) === seed
    }
}

export default Mnemonic;