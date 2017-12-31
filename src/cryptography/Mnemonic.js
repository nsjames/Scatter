import bip39 from 'bip39'
import createHash from 'create-hash';

export class Mnemonic {
    static generateMnemonic(password) {
        const hash = createHash("sha256").update(password).digest('hex');
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
        const hash = createHash("sha256").update(password).digest('hex');
        let mnemonic = bip39.entropyToMnemonic(hash);
        if(!bip39.validateMnemonic(mnemonic)) return false;
        return bip39.mnemonicToSeedHex(mnemonic) === seed
    }
}