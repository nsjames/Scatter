import {Mnemonic} from '../cryptography/Mnemonic';
import {PasswordHasher} from '../cryptography/PasswordHasher';
import {ScatterData} from '../models/scatter';
import {Keychain} from '../models/keychain';
import {LocalStream} from '../streams/LocalStream';


const KeychainComponent = {
    template:require('../partials/keychain.html'),

    data() {
        return {
            listState:'history',
            listItems:[1,2,3,4,5,6]
        };
    },
    methods: {
        setData:function(obj){ console.log("Setting data: ", obj); },
        toggleListState:function(){ this.listState = this.listState === 'history' ? 'domains' : 'history' },
        lock:function(){
            console.log("Locking");
            LocalStream.send({msg:'lock'}).then(locked => {
                console.log("LOCKED?: ", locked)
                Vue.prototype.scatterData = ScatterData.fromJson(locked);
                this.$router.push({name:'auth'});
            })
        }
    }

};

module.exports = KeychainComponent;