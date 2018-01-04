import {RandomIdGenerator} from 'scattermodels';
import Scatterdapp from 'scatterdapp';
import Eos from 'eosjs';

window.Eos = Eos;

// Scatter itself is set to the window inside the encrypted stream object
let eos = new Scatterdapp(RandomIdGenerator.generate(12));




