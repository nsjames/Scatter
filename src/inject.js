import { InjectedEOS } from './eos/InjectedEOS'
import {RandomKeyGen} from './cryptography/RandomKeyGen';

let eos = new InjectedEOS(RandomKeyGen.generate(12));
window.scatter = eos;
document.dispatchEvent(new CustomEvent("scatterLoaded", {detail:{type:'loaded'}}));




