export class KeyPair {
	
	constructor(){
        this.publicKey = null;
        this.privateKey = null;
        this.accounts = null;

        this.removed = null;
	}

	static placeholder(){
		let p = new KeyPair();
		p.publicKey = '';
		p.privateKey = '';
		p.accounts = [];
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

    getHighestAuthority(){
		let sorted = Object.assign([], this.accounts).sort((a,b) => {
            let auth = a.authority.toLowerCase();
            return Authorities[auth] || 0;
        })
		return (sorted.length) ? sorted[0].authority : 'No account found';
	}

	hasOwnerAuthority(){
    	return this.getHighestAuthority().toLowerCase() === 'owner';
	}

	remove(){ this.removed = true; }
	revertRemoval(){ this.removed = false; }
	clone(){ return KeyPair.fromJson(Object.assign({}, this)) }
}
const Authorities = [{owner:1, active:2}]