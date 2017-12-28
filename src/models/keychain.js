import {Wallet} from "../models/wallet";

export class Keychain {

	constructor(){
        this.pHash = null;
        this.wHash = null;
        this.wallets = null;
	}

	static placeholder() {
		let p = new Keychain();
		p.pHash = '';
		p.wHash = '';
		p.wallets = [];
		return p;
	}

	static fromJson(json) {
		let p =  Object.assign(this.placeholder(), json);
		p.wallets = json.wallets.map(x => Wallet.fromJson(x));
		return p;
	}
}