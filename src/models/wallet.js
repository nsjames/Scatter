import {KeyPair} from "../models/keypair";
import {WaterfallEncryption} from '../cryptography/WaterfallEncryption';
import {AES} from '../cryptography/AES';

export class Wallet {

	constructor(){
        this.name = null;
        this.keyPairs = null;
        this.balance = null;
        this.lastKnownConversionRate = null;
        this.whitelist = null;
        this.default = null;

        this.editing = false;
	}

	static placeholder() {
		let p = new Wallet();
		p.name = '';
		p.keyPairs = [];
		p.balance = 0;
		p.lastKnownConversionRate = 0.00;
		p.whitelist = [];
		p.default = '';
		return p;
	}

	static fromJson(json) {
		let p = Object.assign(this.placeholder(), json);
		if(json.hasOwnProperty('keyPairs')) p.keyPairs = json.keyPairs.map(x => KeyPair.fromJson(x));
		return p;
	}

	static newWallet(){
		let p = this.placeholder();
		p.name = '';
		p.editing = true;
        p.name = '';
		return p;
	}

	edit(){ this.editing = true; }
	stopEditing(){ this.editing = false; }
	clone(){ return Wallet.fromJson(Object.assign({}, this)); }
	getDefaultKeyPair(){ return (this.default.length) ? this.keyPairs.filter(x => x.publicKey === this.default)[0] : this.keyPairs[0]; }
	setDefaultKeyPair(keyPair){ this.default = keyPair.publicKey; }
	hasKey(publicKey){ return this.keyPairs.filter(x => x.publicKey === publicKey).length > 0 }
	prepareForSaving(){
		let removedKeys = this.keyPairs.filter(x => x.removed).map(x => x.publicKey);
		this.keyPairs = this.keyPairs.filter(x => !x.removed);
		if(removedKeys.indexOf(this.default) > -1) this.default = '';
        if(!this.default.length) this.default = this.keyPairs[0].publicKey;
	}

	//TODO: Change back to waterfall
	encrypt(passkey){
		this.keyPairs.map(x => x.privateKey = AES.encrypt(x.privateKey, passkey))
		// this.keyPairs.map(x => x.privateKey = WaterfallEncryption.encrypt(x.privateKey, passkey, AES.encrypt))
        this.editing = false;
	}
	decrypt(passkey){
		this.keyPairs.map(x => x.privateKey = AES.decrypt(x.privateKey, passkey))
		// this.keyPairs.map(x => x.privateKey = WaterfallEncryption.decrypt(x.privateKey, passkey, AES.decrypt))
	}

}