import {KeyPair} from "../models/keypair";

export class Wallet {

	constructor(){
        this.name = null;
        this.keyPair = null;
	}

	static placeholder() {
		let p = new Wallet();
		p.name = '';
		p.keyPair = KeyPair.placeholder();
		return p;
	}

	static fromJson(json) {
		let p = Object.assign(this.placeholder(), json);
		p.keyPair = KeyPair.fromJson(json.keyPair);
		return p;
	}
}