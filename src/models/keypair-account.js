export class KeyPairAccount {

    constructor(){
        this.name = null;
        this.authority = null;
    }

    static placeholder(){
        let p = new KeyPairAccount();
        p.name = '';
        p.authority = '';
        return p;
    }

    static fromJson(json) {
        return Object.assign(this.placeholder(), json);
    }

}