<template>
    <section class="auth-component">
        <section class="inputs-container">

            <section v-if="!keychainAvailable">
                <scatter-select v-bind:options="[CREATE_NEW_KEYCHAIN, IMPORT_A_KEYCHAIN]" v-on:changed="updateSelectedKeychainOption"></scatter-select>
                <section v-if="selectedKeychainOption === CREATE_NEW_KEYCHAIN">
                    <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
                    <scatter-button text="Create Keychain" v-on:clicked="createNewKeychain();"></scatter-button>
                </section>

                <section v-if="selectedKeychainOption === IMPORT_A_KEYCHAIN">
                    <scatter-input icon="fa-table" type="text" placeholder="Json Data" v-on:changed="updateKeychainJson"></scatter-input>
                    <scatter-button text="Import JSON Keychain" v-on:clicked="importKeychainFromJson();"></scatter-button>
                </section>

            </section>

            <section v-else>
                <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
                <scatter-button text="Unlock Keychain" v-on:clicked="unlockKeychain();"></scatter-button>
                <figure v-on:click="reset" class="forgot">Recover from seed phrase</figure>
            </section>
        </section>
    </section>
</template>
<script>
    import Vue from 'vue';
    import {LocalStream, ScatterData, Message} from 'scattermodels'
    import {Mnemonic} from '../cryptography/Mnemonic';
    import {PasswordHasher} from '../cryptography/PasswordHasher'
    import {EOSKeygen} from '../cryptography/EOSKeygen'
    import {InternalMessageTypes} from '../messages/InternalMessageTypes';

    export default {
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

                LocalStream.send(Message.payload(InternalMessageTypes.SEED, seed)).then(res => {
                    ScatterData.update(Vue.prototype.scatterData).then(saved => {
                        Vue.prototype.scatterData = ScatterData.fromJson(saved);
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

                let [mnemonic, seed] = Mnemonic.generateMnemonic(this.password);
                LocalStream.send(Message.payload(InternalMessageTypes.SEED, seed)).then(res => {
                    LocalStream.send(Message.signal(InternalMessageTypes.UNLOCK)).then(unlocked => {
                        Vue.prototype.scatterData = ScatterData.fromJson(unlocked);
                        this.$router.push('keychain');
                    })
                });

            },
            importKeychainFromJson:function(){},


            //FOR TESTING ONLY, REMOVE FOR PRODUCTION
            reset:function(){
//                chrome.runtime.sendMessage({ msg: "reset" }, (response) => {
//                    Vue.prototype.scatterData = ScatterData.fromJson(response);
//                });
            },
            log:function(msg){ console.log("MSG", msg) }
        }

    };
</script>