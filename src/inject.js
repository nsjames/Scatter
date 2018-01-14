import {RandomIdGenerator} from 'scattermodels';
import Scatterdapp from 'scatterdapp';
import Eos from 'eosjs';

window.Eos = Eos;
let eos = new Scatterdapp(RandomIdGenerator.generate(12));




