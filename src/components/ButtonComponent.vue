<template>
    <button v-on:click="clicked" :class="{'red':isRed, 'half':isHalf, 'bad-touch':err}">{{text}}</button>
</template>
<script>
    import Vue from 'vue';

    let shakerTimer = null;

    export default {
        data() { return { err:false }; },
        methods: {
            clicked:function(){ this.$emit('clicked') },
            errored:function(){
                clearTimeout(shakerTimer);
                this.err = false;
                shakerTimer = setTimeout(() => { this.err = true; },1)
                shakerTimer = setTimeout(() => { this.err = false; },1000)
            }
        },
        props: ['text', 'isRed', 'isHalf']
    };
</script>