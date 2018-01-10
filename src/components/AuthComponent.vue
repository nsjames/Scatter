<template>
    <section class="auth-component">
        <section class="inputs-container">
            <section v-if="!keychainAvailable">
                <scatter-select v-bind:options="[CREATE_NEW_KEYCHAIN, IMPORT_A_KEYCHAIN]" v-on:changed="updateSelectedKeychainOption"></scatter-select>
                <section v-if="selectedKeychainOption === CREATE_NEW_KEYCHAIN">
                    <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
                    <scatter-button text="Create Keychain" ref="createButton" v-on:clicked="createNewKeychain();"></scatter-button>
                </section>

                <section v-if="selectedKeychainOption === IMPORT_A_KEYCHAIN">
                    <scatter-input icon="fa-table" type="text" placeholder="Json Data" v-on:changed="updateKeychainJson"></scatter-input>
                    <scatter-button text="Import JSON Keychain" v-on:clicked="importKeychainFromJson"></scatter-button>
                </section>

            </section>

            <section v-else>
                <scatter-input icon="fa-lock" type="password" placeholder="Password" v-on:changed="updatePassword"></scatter-input>
                <scatter-button text="Unlock Keychain" ref="unlockButton" v-on:clicked="unlockKeychain();"></scatter-button>
                <figure v-on:click="" class="forgot">Recover from mnemonic</figure>
            </section>
        </section>
    </section>
</template>
<script>
    import Vue from 'vue';
    import {LocalStream, ScatterData, NetworkMessage} from 'scatterhelpers'
    import {Mnemonic} from '../cryptography/Mnemonic';
    import {PasswordHasher} from '../cryptography/PasswordHasher'
    import {EOSKeygen} from '../cryptography/EOSKeygen'
    import {InternalMessageTypes} from '../messages/InternalMessageTypes';
    import {AuthenticationService} from '../services/AuthenticationService';

    const CREATE_NEW_KEYCHAIN = 'Create new keychain';
    const IMPORT_A_KEYCHAIN = 'Import a keychain';
    export default {
        data() {
            return {
                CREATE_NEW_KEYCHAIN:CREATE_NEW_KEYCHAIN,
                IMPORT_A_KEYCHAIN:IMPORT_A_KEYCHAIN,

                keychainAvailable:Vue.prototype.scatterData.data.hash !== '',
                selectedKeychainOption:CREATE_NEW_KEYCHAIN,
                keychain:null,
                keychainJson:{},

                password:''
            };
        },
        methods: {
            updatePassword:function(x){ this.password = x; },
            updateKeychainJson:function(x){ this.keychainJson = x; },
            updateSelectedKeychainOption:function(x){ this.selectedKeychainOption = x; },

            createNewKeychain:function(){
                window.ui.waitFor(
                    AuthenticationService.create(this.password, Vue.prototype.scatterData).then(res => {
                        Vue.prototype.scatterData = res.scatter;
                        //TODO: Display mnemonic instead before routing to 'keychain'
                        console.log('mnemonic', res.mnemonic);
                        window.ui.pushError('Save Your Mnemonic Safely Offline ( Write it down! )', res.mnemonic);

                        this.keychainAvailable = true;
                        Vue.prototype.hideSettingsButton = false;
                        this.$router.push({name:'keychain'});
                    }).catch(badPassword => {
                        window.ui.pushError('Password Error', 'Passwords must be at least 8 characters long.');
                        this.$refs.createButton.errored();
                    })
                )
            },

            unlockKeychain:function(){
                window.ui.waitFor(
                    AuthenticationService.authenticate(this.password, Vue.prototype.scatterData.data.hash).then(scatter => {
                        Vue.prototype.scatterData = scatter;
                        this.$router.push('keychain');
                    }).catch(badPassword => this.$refs.unlockButton.errored())
                )
            },

            importKeychainFromJson:function(){
                const err = () => window.ui.pushError('Bad JSON', 'It looks like we can\'t parse this JSON keychain.');
                if(this.keychainJson.indexOf('hash') === -1){ err(); return false; }
                if(this.keychainJson.indexOf('settings') === -1){ err(); return false; }
                if(this.keychainJson.indexOf('wallets') === -1){ err(); return false; }
                const scatterdata = Object.assign({}, Vue.prototype.scatterData);
                scatterdata.data = JSON.parse(this.keychainJson);
                window.ui.waitFor(
                    LocalStream.send(NetworkMessage.payload(InternalMessageTypes.UPDATE, scatterdata)).then(scatter => {
                        Vue.prototype.scatterData = ScatterData.fromJson(scatter);
                        location.reload();
                    }).catch(e => { window.ui.pushError('Binding Error', 'There was an issue binding the keychain json to scatter') })
                )
            }
        }

    };
</script>