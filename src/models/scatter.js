import {Network} from "../models/network";
import {Settings} from "../models/settings";
import {Keychain} from "../models/keychain";

export class ScatterData {

	constructor(){
        this.meta = null;
        this.data = null;
	}

	static placeholder() {
		let p = new ScatterData();
		p.meta = Meta.placeholder();
		p.data = Data.placeholder();
		return p;
	}

	static fromJson(json) {
		let p = Object.assign(this.placeholder(), json);
		if(json.hasOwnProperty('meta')) p.meta = Meta.fromJson(json.meta);
		if(json.hasOwnProperty('data')) p.data = Data.fromJson(json.data);
		return p;
	}

}

export class Meta {

	constructor(){
		this.version = null;
	}

	static placeholder() {
		let p = new Meta();
		p.version = '';
		return p;
	}

	static fromJson(json) {
		return Object.assign(this.placeholder(), json);
	}
}

export class Data {

	constructor(){
        this.settings = null;
        this.keychain = null;
        this.whitelist = null;
        this.blacklist = null;
	}

	static placeholder() {
		let p = new Data();
		p.settings = Settings.placeholder();
		p.keychain = Keychain.placeholder();
		p.whitelist = [];
		p.blacklist = [];
		return p;
	}

	static fromJson(json) {
		let p = Object.assign(this.placeholder(), json);
		p.settings = Settings.fromJson(json.settings);
		p.keychain = Keychain.fromJson(json.keychain);
		return p;
	}
}