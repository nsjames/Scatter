<template>
    <section class="settings-component">
        <scatter-select v-if="!editingNetwork && !exportingPrivateKey && !confirmingDestroyKeychain" v-bind:options="['Add New Network'].concat(networks.map(function(x){return `${x.name}@${x.host}`}))"
                        v-bind:force-selected-option="`${currentNetwork.name}@${currentNetwork.host}`" v-on:changed="updateSelectedNetwork"></scatter-select>
        <section v-if="!editingNetwork && !exportingPrivateKey && !confirmingDestroyKeychain">
            <!--<scatter-select v-bind:options="['USD - United States Dollar']"></scatter-select>-->
            <scatter-button text="Edit Selected Network" v-on:clicked="editCurrentNetwork" style="z-index:2;"></scatter-button>
            <scatter-button text="Export Private Key" style="z-index:2;" v-on:clicked="toggleExportingPrivateKey"></scatter-button>
            <a download="keychain.key" v-bind:href="'data:text/plain;charset=utf-8,'+encodeURIComponent(JSON.stringify(keychain))"><scatter-button text="Export Encrypted Keychain" style="z-index:2;" v-on:clicked="dummy"></scatter-button></a>
            <!-- TODO: <scatter-button text="Change Password" is-red="true" v-on:clicked="dummy"></scatter-button>-->
            <scatter-button text="Destroy Keychain" is-red="true" v-on:clicked="toggleConfirmingDestroyKeychain"></scatter-button>
        </section>
        <section v-else-if="editingNetwork">
            <section v-if="!confirmingRemoval">
                <scatter-input icon="fa-server" type="text" placeholder="Name" v-bind:input-text="editableNetwork.name" v-on:changed="updateNewNetworkName"></scatter-input>
                <scatter-input icon="fa-globe" type="text" placeholder="Host" v-bind:input-text="editableNetwork.host" v-on:changed="updateNewNetworkHost"></scatter-input>
                <scatter-input icon="fa-plug" type="number" placeholder="Port" v-bind:input-text="(editableNetwork.port === -1) ? 8888 : editableNetwork.port" v-on:changed="updateNewNetworkPort"></scatter-input>
                <scatter-button text="Add New Network" v-if="addingNew" v-on:clicked="addNewNetwork"></scatter-button>
                <scatter-button text="Update Network" v-if="!addingNew" v-on:clicked="updateNetwork"></scatter-button>
                <scatter-button text="Remove Network" is-red="true" v-if="!addingNew" v-on:clicked="confirmRemoval"></scatter-button>
                <scatter-button text="Cancel" v-on:clicked="cancelEditing"></scatter-button>
            </section>
            <section v-else style="text-align:center;">
                <h2>You are removing {{`${currentNetwork.name}@${currentNetwork.host}`}}</h2>
                <h4>Are you sure?</h4>
                <scatter-button text="Confirm" is-half="true" is-red="true" v-on:clicked="removeNetwork"></scatter-button>
                <scatter-button text="Cancel" is-half="true" v-on:clicked="cancelRemoval"></scatter-button>
            </section>
        </section>
        <section v-else-if="exportingPrivateKey">
            <scatter-select v-bind:options="keyPairs.map(function(kp){ return `${kp.publicKey}` })"
                            v-bind:force-selected-option="'Select a public key'" v-on:changed="exposePrivateKey"></scatter-select>
            <a id="PRIVATE_KEY_DOWNLOAD"><button v-if="exposedPrivateKey" style="word-break:break-all">Download Private Key</button></a>
            <scatter-button text="Back To Settings" v-on:clicked="toggleExportingPrivateKey"></scatter-button>
        </section>
        <section v-else-if="confirmingDestroyKeychain">
            <h2>You are about to destroy your entire keychain.</h2>
            <h4>This includes all wallets and keypairs, and is irreversible. If you haven't made a backup of your keychain go back and click the <b>Export Encrypted Keychain</b> button.</h4>
            <section style="text-align:center;">
                <div style="height:1px; width:100%; background:rgba(0,0,0,0.05); margin:10px 0 30px"></div>
                <scatter-button text="Destroy" is-half="true" is-red="true" v-on:clicked="confirmKeychainDestruction"></scatter-button>
                <scatter-button text="Cancel" is-half="true" v-on:clicked="toggleConfirmingDestroyKeychain"></scatter-button>
            </section>
        </section>
    </section>
</template>
<script>
    import Vue from 'vue';
    import {ScatterData, Network, LocalStream, NetworkMessage} from 'scattermodels';
    import {InternalMessageTypes} from '../messages/InternalMessageTypes';

    export default {
        data() {
            return {
                networks:Vue.prototype.scatterData.data.settings.networks,
                currentNetwork:Vue.prototype.scatterData.data.settings.currentNetwork,
                editingNetwork:false,
                preEditedNetwork:Network.placeholder(),
                editableNetwork:Network.placeholder(),
                addingNew:false,
                confirmingRemoval:false,
                exportingPrivateKey:false,
                keyPairs:Vue.prototype.scatterData.data.keychain.wallets.map(x => x.keyPairs).reduce((a,b) => a.concat(b), []),
                exposedPrivateKey:false,
                keychain:Vue.prototype.scatterData.data,
                confirmingDestroyKeychain:false,
            };
        },
        methods: {
            dummy:function(){},
            confirmKeychainDestruction:function(){
                window.ui.waitFor(
                    setTimeout(() => {
                        LocalStream.send(NetworkMessage.signal(InternalMessageTypes.DESTROY_KEYCHAIN)).then(nothing => {
                            this.$router.push({name:'auth'})
                            location.reload();
                        })
                    },2000)
                )
            },
            createPrivateKeyDownload:function(text,filename){
                const a = document.getElementById('PRIVATE_KEY_DOWNLOAD');
                if(!a) return false;
                a.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
                a.setAttribute('download', filename);
            },
            exposePrivateKey:function(publicKey){
                LocalStream.send(NetworkMessage.payload(InternalMessageTypes.PUBLIC_TO_PRIVATE, publicKey)).then(privateKey => {
                    this.exposedPrivateKey = true;
                    const text = `Public Key: ${publicKey} \r\nPrivate Key: ${privateKey}`;
                    this.createPrivateKeyDownload(text, `${publicKey.substr(0,6)}...${publicKey.substr(-4)}.key`)
                }).catch(e => { console.log(e); window.ui.pushError('Decryption Error', 'There was a problem decrypting the private key for '+publicKey) })
            },
            toggleExportingPrivateKey:function(){ this.exportingPrivateKey = !this.exportingPrivateKey; this.exposedPrivateKey = false; },
            toggleConfirmingDestroyKeychain:function(){ this.confirmingDestroyKeychain = !this.confirmingDestroyKeychain; },
            cancelEditing:function(){ this.editingNetwork = false; },
            updateNewNetworkName:function(x){ this.editableNetwork.name = x; },
            updateNewNetworkHost:function(x){ this.editableNetwork.host = x; },
            updateNewNetworkPort:function(x){ this.editableNetwork.port = x; },
            editCurrentNetwork:function(){
                this.addingNew = false;
                this.editableNetwork = this.currentNetwork.clone();
                this.preEditedNetwork = this.currentNetwork.clone();
                this.editingNetwork = true;
                console.log('this.preEditedNetwork', this.preEditedNetwork)
            },
            updateNetwork:function(){
                let previous = this.networks.find(x => x.name === this.preEditedNetwork.name);
                if(previous){
                    if(!this.validateNetwork()) return false;
                    const clone = this.editableNetwork.clone();
                    this.networks = this.networks.filter(x => x.name !== previous.name).concat(clone);
                    this.currentNetwork = clone;

                    Vue.prototype.scatterData.data.settings.networks = this.networks;
                    Vue.prototype.scatterData.data.settings.currentNetwork = this.currentNetwork;
                    ScatterData.update(Vue.prototype.scatterData);

                    this.preEditedNetwork = Network.placeholder();
                    this.editableNetwork = Network.placeholder();
                    this.editingNetwork = false;
                }
                console.log("Updating network", this.editableNetwork);
            },
            confirmRemoval:function(){
                if(this.networks.length === 1){
                    window.ui.pushError('Network Removal', 'You cannot remove your last network. Create a new one before removing this one.');
                    return false;
                }
                this.confirmingRemoval = true;
            },
            cancelRemoval:function(){ this.confirmingRemoval = false; },
            removeNetwork:function(){
                if(this.networks.length === 1){
                    window.ui.pushError('Network Removal', 'You cannot remove your last network. Create a new one before removing this one.');
                    return false;
                }
                Vue.prototype.scatterData.data.settings.networks = this.networks.filter(x => x.name !== this.preEditedNetwork.name);
                Vue.prototype.scatterData.data.settings.currentNetwork = this.networks[0];
                ScatterData.update(Vue.prototype.scatterData);

                this.networks = Vue.prototype.scatterData.data.settings.networks;
                this.currentNetwork = Vue.prototype.scatterData.data.settings.currentNetwork;
                this.preEditedNetwork = Network.placeholder();
                this.editableNetwork = Network.placeholder();
                this.editingNetwork = false;
                this.cancelRemoval();
            },
            addNewNetwork:function(){
                if(!this.validateNetwork()) return false;

                Vue.prototype.scatterData.data.settings.networks.push(this.editableNetwork);
                Vue.prototype.scatterData.data.settings.currentNetwork = this.editableNetwork;
                ScatterData.update(Vue.prototype.scatterData);

                this.networks = Vue.prototype.scatterData.data.settings.networks;
                this.currentNetwork = Vue.prototype.scatterData.data.settings.currentNetwork;
                this.editableNetwork = Network.placeholder();
                this.editingNetwork = false;
            },
            updateSelectedNetwork:function(networkName){
                this.editingNetwork = false;

                if(networkName === 'Add New Network'){
                    this.addingNew = true;
                    this.editingNetwork = true;
                    this.editableNetwork = Network.placeholder();
                    return false;
                }

                const network = Vue.prototype.scatterData.data.settings.networks.find(x => x.name === networkName.split('@')[0]);
                if(network)  {
                    Vue.prototype.scatterData.data.settings.currentNetwork = network;
                    this.currentNetwork = network;
                    ScatterData.update(Vue.prototype.scatterData);
                }
            },
            validateNetwork:function(){
                if(!this.editableNetwork.name.length){
                    window.ui.pushError('Network Name', 'You must name this network.');
                    return false;
                }
                if(this.preEditedNetwork.name !== this.editableNetwork.name && this.networks.filter(x => x.name.toLowerCase() === this.editableNetwork.name.toLowerCase()).length){
                    window.ui.pushError('Network Name', `Network names must be unique and you already have a network named ${this.editableNetwork.name}.`);
                    return false;
                }
                if(!this.editableNetwork.host.length || this.editableNetwork.host.indexOf('/') > -1 || this.editableNetwork.host.indexOf('.') === -1){
                    window.ui.pushError('Network Host', `Invalid network host. Network hosts must either be IPs ( 192.168.0.1 ) or domain names without any protocols or sub routes. ( testnet.yourdomain.com )`);
                    return false;
                }
                return true;
            }
        }
    };
</script>