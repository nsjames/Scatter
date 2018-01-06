<template>
    <section class="alert working" :class="{'show':ui.working}">

        <figure class="wait-logo">Scatter</figure>

        <section class="loader">
            <figure class="spinner"></figure>
        </section>

    </section>
</template>
<script>
    import Vue from 'vue';

    export default {
        data() {
            return { ui:window.ui }
        }
    };
</script>
