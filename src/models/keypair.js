export class KeyPair {
	
	constructor(){
        this.publicKey = null;
        this.privateKey = null;
	}

	static placeholder(){
		let p = new KeyPair();
		p.publicKey = '';
		p.privateKey = '';
		return p;
	}

	static fromJson(json) {
		return Object.assign(this.placeholder(), json);
	}

	static fromPair(priv, pub) {
		let p = this.placeholder();
		p.privateKey = priv;
		p.publicKey = pub;
		return p;
	}
}