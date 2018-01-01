import {RandomKeyGen} from './cryptography/RandomKeyGen';
import Scatterdapp from 'scatterdapp';

let eos = new Scatterdapp(RandomKeyGen.generate(12));
// window.scatter = eos;
// document.dispatchEvent(new CustomEvent("scatterLoaded", {detail:{type:'loaded'}}));




