import {StorageService} from './services/StorageService'
import {ScatterData} from './models/scatter'
import {LocalStream} from './streams/LocalStream';

import AuthComponent from './components/AuthComponent'
import KeychainComponent from './components/KeychainComponent'
import SettingsComponent from './components/SettingsComponent'
import ButtonComponent from './components/ButtonComponent'
import InputComponent from './components/InputComponent'
import SelectComponent from './components/SelectComponent'

export class Popup {

    constructor(){
        LocalStream.send({ msg: "load" }).then(scatter => {
            console.log("Loaded: ", scatter)
            Vue.prototype.scatterData = ScatterData.fromJson(scatter);
            this.setupApp();
        });
    }

    setupApp(){
        this.setupRouting();
        this.registerReusableComponents();

        this.app = new Vue({
            router:this.router
        }).$mount('#scatter');


    }

    registerReusableComponents(){
        Vue.component('scatter-button', ButtonComponent);
        Vue.component('scatter-input', InputComponent);
        Vue.component('scatter-select', SelectComponent);
    }

    setupRouting(){
        this.router = new VueRouter({ routes:routes });
        this.router.beforeEach((to, from, next) => {
            console.log(this.router.currentRoute);
            switch(to.name){
                case 'auth': this.beforeAuth(next); break;
                case 'keychain': this.beforeKeychain(next); break;
                case 'settings': this.beforeSettings(next); break;
                default:next()
            }
        });

        Vue.prototype.toggleSettings = () => {
            this.router.push({name:(this.router.currentRoute.name === 'settings' ? 'auth' :'settings')});
        }
        // TODO: Adding global methods here for now.
        Vue.prototype.truncateKey = (key) => { return (key.length) ? key.substr(0, 3) + '.....' + key.substr(key.length -4) : ''; }
        Vue.prototype.hideSettingsButton = false;
    }

    beforeAuth(next){
        if(!Vue.prototype.scatterData.data.locked) next({name:'keychain'});
        else next()
    }

    beforeKeychain(next){
        if(Vue.prototype.scatterData.data.locked) next({name:'auth'});
        else next()
    }

    beforeSettings(next){
        console.log("SETTINGS")
        next()
    }


}

const routes = [
    { path: '', name:'auth', component: AuthComponent},
    { path: '/keychain', name:'keychain', component: KeychainComponent},
    { path: '/settings', name:'settings', component: SettingsComponent}
];

export const popup = new Popup();