import {Network} from "../models/network";
import {Settings} from "../models/settings";
import {Keychain} from "../models/keychain";
import {StorageService} from '../services/StorageService';
import {WaterfallEncryption} from '../cryptography/WaterfallEncryption'
import {AES} from '../cryptography/AES';
import {LocalStream} from '../streams/LocalStream';

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
		if(!json) return p;
		if(json.hasOwnProperty('meta')) p.meta = Meta.fromJson(json.meta);
		if(json.hasOwnProperty('data')) p.data = Data.fromJson(json.data);
		return p;
	}
	lock(){ this.data.locked = true; }
    unlock(){ this.data.locked = false; }

    static update(scatter){
        return new Promise((resolve, reject) => {
            LocalStream.send({msg:'update', scatter}).then(response => {
                resolve(response);
            })
		})
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
        this.locked = null; //TODO: Change this from a property here to a method inside of the BG script ( using seed existence verification )
        this.hash = "";
	}

	static placeholder() {
		let p = new Data();
		p.settings = Settings.placeholder();
		p.keychain = Keychain.placeholder();
		p.whitelist = [];
		p.blacklist = [];
		p.locked = true;
		p.hash = '';
		return p;
	}

	static fromJson(json) {
		let p = Object.assign(this.placeholder(), json);
		p.settings = Settings.fromJson(json.settings);
		p.keychain = Keychain.fromJson(json.keychain);
		return p;
	}
}