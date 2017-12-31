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
		return (this.accounts.length) ? this.accounts[0].authority.toLowerCase() : 'No account found';
	}

	hasOwnerAuthority(){
    	return this.getHighestAuthority().toLowerCase() === 'owner';
	}

	remove(){ this.removed = true; }
	revertRemoval(){ this.removed = false; }
	clone(){ return KeyPair.fromJson(Object.assign({}, this)) }
	setAccounts(accounts){ this.accounts = this.sortAccounts(accounts); }

	sortAccounts(accounts){
		return Object.assign([], accounts).sort((a,b) => {
            return (Authorities[a.authority.toLowerCase()] || 0) < Authorities[b.authority.toLowerCase()] || 0;
        });
	}
}
const Authorities = {owner:2, active:1};