import {ScatterData} from './models/scatter'
import {LocalStream} from './streams/LocalStream';

import AuthComponent from './components/AuthComponent.vue'
import KeychainComponent from './components/KeychainComponent.vue'
import SettingsComponent from './components/SettingsComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import InputComponent from './components/InputComponent.vue'
import SelectComponent from './components/SelectComponent.vue'

import Vue from 'vue'
import VueRouter from 'vue-router'

export class Popup {

    constructor(){
        LocalStream.send({ msg: "load" }).then(scatter => {
            //TODO: For the love of god, take me out of Vue's window scope [ I am insecure ] [ and not like.. teenage angst insecure, like Deebo has the keys to your house insecure ]
            Vue.prototype.scatterData = ScatterData.fromJson(scatter);
            LocalStream.send({msg:'locked?'}).then(isLocked => {
                Vue.prototype.scatterData.data.keychain.locked = isLocked;
                this.setupApp();
            })

        });
    }

    setupApp(){

        this.setupRouting();
        this.registerReusableComponents();

        this.app = new Vue({
            router:this.router
        }).$mount('#scatter');

        Vue.prototype.scatterReady = true;


    }

    registerReusableComponents(){
        Vue.component('scatter-button', ButtonComponent);
        Vue.component('scatter-input', InputComponent);
        Vue.component('scatter-select', SelectComponent);
    }

    setupRouting(){
        this.router = new VueRouter({ routes:routes });

        this.router.beforeEach((to, from, next) => {
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
        if(!Vue.prototype.scatterData.data.keychain.locked) next({name:'keychain'});
        else next()
    }

    beforeKeychain(next){
        if(Vue.prototype.scatterData.data.keychain.locked) next({name:'auth'});
        else next()
    }

    beforeSettings(next){
        next()
    }


}
const routes = [
    { path: '', name:'auth', component: AuthComponent},
    { path: '/keychain', name:'keychain', component: KeychainComponent},
    { path: '/settings', name:'settings', component: SettingsComponent}
];



export const popup = new Popup();