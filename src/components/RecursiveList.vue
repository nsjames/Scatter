<template>
    <section class="recursive-list">
        <section class="key-value" :class="{'recursive':recursive, 'array':(typeof value !== 'object' && !nonNumeric(key))}" v-for="(value, key, index) in kvmap">
            <figure class="prop-bubble" v-if="nonNumeric(key)">{{key}}</figure>
            <figure class="prop-bubble" v-if="typeof value === 'object'">
                <recursive-list v-bind:kvmap="value" v-bind:selected-key-pair="selectedKeyPair" recursive="true"></recursive-list>
            </figure>
            <figure class="prop-bubble" :class="{'array-item':(typeof value !== 'object' && !nonNumeric(key))}" v-else>
                {{(value === '[scatter]') ? selectedKeyPair.getHighestAuthorityName() : value}}
            </figure>
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
        props: ['kvmap', 'recursive', 'selectedKeyPair']
    };
</script>