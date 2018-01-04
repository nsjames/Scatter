import Vue from 'vue'
import {LocalStream, NetworkMessage, ScatterData} from 'scattermodels'
import RequestUnlockPrompt from './components/prompts/RequestUnlockPrompt.vue'
import RequestAuthPrompt from './components/prompts/RequestAuthPrompt.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import InputComponent from './components/InputComponent.vue'
import SelectComponent from './components/SelectComponent.vue'
import RecursiveList from './components/RecursiveList.vue'
import {InternalMessageTypes} from './messages/InternalMessageTypes';

Vue.config.productionTip = false;
let app = new WeakMap();
const background = chrome.extension.getBackgroundPage();

LocalStream.send(NetworkMessage.signal(InternalMessageTypes.LOAD)).then(scatter => {
    //TODO: For the love of god, take me out of Vue's window scope [ I am insecure ] [ and not like.. teenage angst insecure, like Deebo has the keys to your house insecure ]
    Vue.prototype.scatterData = ScatterData.fromJson(scatter);
    LocalStream.send(NetworkMessage.signal(InternalMessageTypes.IS_LOCKED)).then(isLocked => {
        Vue.prototype.scatterData.data.keychain.locked = isLocked;
        setupApp();
    })

});

function setupApp(){
    Vue.prototype.scatterPrompt = null;
    registerReusableComponents();

    app = new Vue({
        el:'#prompt',
        data:{
            prompt:null
        }
    });

    setTimeout(() => {
        app.prompt = window.scatterPrompt;
        console.log(app.prompt);
    }, 20);
}

function registerReusableComponents(){
    Vue.component('request-unlock-prompt', RequestUnlockPrompt);
    Vue.component('request-auth-prompt', RequestAuthPrompt);
    Vue.component('scatter-button', ButtonComponent);
    Vue.component('scatter-input', InputComponent);
    Vue.component('scatter-select', SelectComponent);
    Vue.component('recursive-list', RecursiveList);
}

// setupApp();
