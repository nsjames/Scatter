import Vue from 'vue'
import VueRouter from 'vue-router'
import {ScatterData, LocalStream, NetworkMessage} from 'scatterhelpers'
import AuthComponent from './components/AuthComponent.vue'
import KeychainComponent from './components/KeychainComponent.vue'
import SettingsComponent from './components/SettingsComponent.vue'
import SendComponent from './components/SendComponent.vue'
import ButtonComponent from './components/ButtonComponent.vue'
import WorkingAlert from './components/alerts/WorkingAlert.vue'
import ErrorAlert from './components/alerts/ErrorAlert.vue'
import InputComponent from './components/InputComponent.vue'
import SelectComponent from './components/SelectComponent.vue'
import {InternalMessageTypes} from './messages/InternalMessageTypes';
import {ui} from './ui';

Vue.config.productionTip = false;
Vue.use(VueRouter);

let router = null;

const routes = [
    { path: '', name:'auth', component: AuthComponent},
    { path: '/keychain', name:'keychain', component: KeychainComponent},
    { path: '/settings', name:'settings', component: SettingsComponent},
    { path: '/send', name:'send', component: SendComponent}
];

LocalStream.send(NetworkMessage.signal(InternalMessageTypes.LOAD)).then(scatter => {
    //TODO: For the love of god, take me out of Vue's window scope [ I am insecure ] [ and not like.. teenage angst insecure, like Deebo has the keys to your house insecure ]
    Vue.prototype.scatterData = ScatterData.fromJson(scatter);
    LocalStream.send(NetworkMessage.signal(InternalMessageTypes.IS_LOCKED)).then(isLocked => {
        Vue.prototype.scatterData.data.keychain.locked = isLocked;
        setupApp();
    })

});

function setupApp(){
    setupRouting();
    setupGlobals();
    registerReusableComponents();
    new Vue({router}).$mount('#scatter');
}

function registerReusableComponents(){
    Vue.component('scatter-button', ButtonComponent);
    Vue.component('scatter-input', InputComponent);
    Vue.component('scatter-select', SelectComponent);
    Vue.component('working-alert', WorkingAlert);
    Vue.component('error-alert', ErrorAlert);
}

function setupRouting(){
    router = new VueRouter({routes});
    router.beforeEach((to, from, next) => {
        switch(to.name){
            case 'auth': beforeAuth(next); break;
            case 'keychain': lockGuard(next); break;
            case 'send': lockGuard(next); break;
            default:next()
        }
    });
}

function setupGlobals(){
    window.ui = ui;
    Vue.prototype.toggleSettings = () => router.push({name:(router.currentRoute.name === 'settings' ? 'auth' :'settings')});
    Vue.prototype.hideSettingsButton = Vue.prototype.scatterData.data.hash === '';
    Vue.filter('money', function (value) {
        if(!value || value.toString() === '0') return '0.00';
        let decimals = (value.toString().split('.')[1] || '').length;
        let val = (value/1).toFixed(decimals).replace(',', '.');
        let whole = val.toString().split('.')[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        let fractions = (val.toString().split('.').length === 2) ? val.toString().split('.')[1] : '00';
        return `${whole}.${fractions}`
    })
    Vue.filter('expiration', function (date) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        function dateSuffix(d){ return (d>=4) ? d+'th' : (d===1) ? d+'st' : (d===2) ? d+'nd' : d+'rd'; }
        const d = new Date(date);
        return `${months[d.getUTCMonth()]} ${dateSuffix(d.getUTCDate())} ${d.getUTCFullYear()}`;
    })
    Vue.filter('truncdec', function (num, places) {
        const split = num.toString().split('.');
        const whole = split[0];
        const decimals = split[1] || '00';
        return `${whole}.${decimals.substr(0, places)}`
    })

}

function beforeAuth(next){ if(!Vue.prototype.scatterData.data.keychain.locked) next({name:'keychain'}); else next() }
function lockGuard(next){ if(Vue.prototype.scatterData.data.keychain.locked) next({name:'auth'}); else next() }