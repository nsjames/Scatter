<template>
    <section class="recursive-list">
        <section class="key-value" :class="{'recursive':recursive}" v-for="(value, key, index) in kvmap">
            <figure class="prop-bubble" v-if="nonNumeric(key)">{{key}}</figure>
            <figure class="prop-bubble" v-if="typeof value === 'object'">
                <recursive-list v-bind:kvmap="value" recursive="true"></recursive-list>
            </figure>
            <figure class="prop-bubble" v-else>{{value}}</figure>
        </section>
    </section>
</template>
<script>
    export default {
        data() { return {}; },
        methods: {
            nonNumeric:function(key){
                return isNaN(key);
            }
        },
        props: ['kvmap', 'recursive']
    };
</script>