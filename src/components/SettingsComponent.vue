<template>
    <section class="settings-component">
        <scatter-select v-if="!editingNetwork" v-bind:options="['Add New Network'].concat(networks.map(function(x){return `${x.name}@${x.host}`}))"
                        v-bind:force-selected-option="`${currentNetwork.name}@${currentNetwork.host}`" v-on:changed="updateSelectedNetwork"></scatter-select>
        <section v-if="!editingNetwork">
            <!--<scatter-select v-bind:options="['USD - United States Dollar']"></scatter-select>-->
            <scatter-button text="Edit Selected Network" v-on:clicked="editCurrentNetwork" style="z-index:2;"></scatter-button>
            <scatter-button text="Export Private Key" style="z-index:2;" v-on:clicked="dummy"></scatter-button>
            <scatter-button text="Export Encrypted Keychain" style="z-index:2;" v-on:clicked="dummy"></scatter-button>
            <scatter-button text="Destroy Keychain" is-red="true" v-on:clicked="dummy"></scatter-button>
        </section>
        <section v-else>
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
    </section>
</template>
<script>
    import Vue from 'vue';
    import {ScatterData, Network} from 'scatterhelpers';

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
            };
        },
        methods: {
            dummy:function(){},
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