import {Mnemonic} from '../cryptography/Mnemonic';
import {PasswordHasher} from '../cryptography/PasswordHasher';
import {ScatterData} from '../models/scatter';
import {Keychain} from '../models/keychain';
import {LocalStream} from '../streams/LocalStream';


const AuthComponent = {
    template:require('../partials/auth.html'),

    data() {
        return {
            CREATE_NEW_KEYCHAIN:'Create new keychain',
            IMPORT_A_KEYCHAIN:'Import a keychain',

            keychainAvailable:Vue.prototype.scatterData.data.hash !== '',
            selectedKeychainOption:'Create new keychain',
            keychain:null,
            keychainJson:{},

            password:''
        };
    },
    methods: {
        setData:function(obj){ console.log("Setting data: ", obj); },
        updatePassword:function(x){ this.password = x; },
        updateKeychainJson:function(x){ this.keychainJson = x; },
        updateSelectedKeychainOption:function(x){ this.selectedKeychainOption = x; },

        createNewKeychain:function(){
            // TODO: Error handling

            let [mnemonic, seed] = Mnemonic.generateMnemonic(this.password);
            Vue.prototype.scatterData.data.hash = PasswordHasher.hash(this.password);
            this.password = '';

            LocalStream.send({msg:'seed', seed}).then(res => {
                ScatterData.update(Vue.prototype.scatterData).then(saved => {
                    //TODO: Display mnemonic instead before routing to 'keychain'
                    console.log('mnemonic', mnemonic);

                    this.keychainAvailable = true;
                    this.$router.push({name:'keychain'});
                })
            });
        },
        unlockKeychain:function(){
            //TODO: Error handling
            if(!this.password.length) return false;
            if(!PasswordHasher.validate(this.password, Vue.prototype.scatterData.data.hash)) return false;

            else {
                LocalStream.send({msg:'unlock'}).then(unlocked => {
                    console.log("MESAGE BACK: ", unlocked)
                    Vue.prototype.scatterData = ScatterData.fromJson(unlocked);
                    this.$router.push('keychain');
                    console.log("Should unlock")
                })

            }

        },
        importKeychainFromJson:function(){},


        //FOR TESTING ONLY, REMOVE FOR PRODUCTION
        reset:function(){
            chrome.runtime.sendMessage({ msg: "reset" }, (response) => {
                Vue.prototype.scatterData = ScatterData.fromJson(response);
            });
            },
        log:function(msg){ console.log("MSG", msg) }
    }

};

module.exports = AuthComponent;