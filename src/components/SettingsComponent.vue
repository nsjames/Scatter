<template>
    <section class="settings-component">
        <scatter-select v-bind:options="networks.map(function(x){return x.name + '@' + x.host})" v-on:changed="updateNetwork"></scatter-select>
        <scatter-select v-bind:options="['USD - United States Dollar']"></scatter-select>
        <scatter-button text="Export Private Key" style="z-index:2;"></scatter-button>
        <scatter-button text="Clear all website permissions"></scatter-button>
        <scatter-button text="Remove keychain from Chrome" is-red="true"></scatter-button>
    </section>
</template>
<script>
    import Vue from 'vue';

    export default {
        data() {
            return {
                networks:Vue.prototype.scatterData.data.settings.networks
            };
        },
        methods: {
            setData:function(obj){ console.log("Setting data: ", obj); },
            updateNetwork:function(networkName){
                const network = Vue.prototype.scatterData.data.settings.networks.find(x => x.name === networkName);
                if(network)  Vue.prototype.scatterData.data.settings.networks.currentNetwork = network;
            }
        }

    };
</script>