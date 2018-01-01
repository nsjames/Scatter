<template>
    <section class="settings-component">
        <scatter-select v-bind:options="['test net 1', 'test net 2']"></scatter-select>
        <scatter-select v-bind:options="['USD - United States Dollar']"></scatter-select>
        <scatter-button text="Export Private Key" style="z-index:2;"></scatter-button>
        <scatter-button text="Clear all website permissions"></scatter-button>
        <scatter-button text="Remove keychain from Chrome" is-red="true"></scatter-button>
    </section>
</template>
<script>
    export default {
        data() {
            return {

            };
        },
        methods: {
            setData:function(obj){ console.log("Setting data: ", obj); },

        }

    };
</script>