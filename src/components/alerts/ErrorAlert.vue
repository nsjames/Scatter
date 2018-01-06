<template>
    <section class="alert error" :class="{'show':ui.errorQueue.length}">

        <section class="box" v-if="ui.errorQueue[0] != null">
            <section class="message">
                <figure class="title">{{ui.errorQueue[0].title}}</figure>
                <figure class="description">{{ui.errorQueue[0].description}}</figure>
            </section>
            <figure class="ok" v-on:click="close">OK</figure>
        </section>

    </section>
</template>
<script>
    export default {
        data() { return { ui:window.ui } },
        methods: { close:function(){ window.ui.errorQueue.shift(); } }
    };
</script>
