<template>
    <button v-on:click="clicked" :class="{'red':isRed, 'half':isHalf}">{{text}}</button>
</template>
<script>
    export default {
        data() { return {}; },
        methods: { clicked:function(){ this.$emit('clicked') } },
        props: ['text', 'isRed', 'isHalf']
    };
</script>