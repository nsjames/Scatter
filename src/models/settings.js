import {Network} from "../models/network";

export class Settings {

	constructor(){
        this.provider = null;
        this.providers = null;
        this.currency = null;
	}

	static placeholder() {
		let p = new Settings();
		p.provider = Network.placeholder();
		p.providers = [];
		p.currency = '';
		return p;
	}

	static fromJson(json) {
		let p = Object.assign(this.placeholder(), json);
		p.provider = Network.fromJson(json.provider);
		p.providers = json.providers.map(x => Network.fromJson(x));
		return p;
	}
}