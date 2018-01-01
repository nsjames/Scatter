<template>
    <section class="input-container" :class="{'half':isHalf}">
        <figure class="icon" v-if="icon"><i class="fa" :class="icon"></i></figure>
        <input :disabled="disabled" :class="{'with-icon':icon}" :placeholder="placeholder" :type="type" v-model="input" />
    </section>
</template>
<script>
    export default {
        data() { return { input:this.inputText }; },
        methods: { changed:function(){ this.$emit('changed', this.input) } },
        props: ['icon', 'type', 'placeholder', 'inputText', 'isHalf', 'disabled'],
        watch: { input: function(n,o) { this.changed(); } }
    };
</script>