export class Network {

	constructor(){
        this.name = null;
        this.host = null;
	}

	static placeholder() {
		let p = new Network();
		p.name = '';
		p.host = '';
		return p;
	}

	static fromJson(json) {
		return Object.assign(this.placeholder(), json);
	}
}