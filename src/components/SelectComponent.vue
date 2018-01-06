<template>
    <section class="select" :class="{'open':open}">
        <figure class="item" v-on:click="toggle">{{selectedOption}}</figure>
        <figure class="arrow" v-on:click="toggle"><i class="fa fa-caret-down"></i></figure>

        <section class="options" :class="{'show':open}">
            <figure class="item" v-on:click="selectOption(option)" v-for="option in options">{{option}}</figure>
        </section>
    </section>
</template>
<script>
    export default {
        data() { return {
            open:false,
            selectedOption:this.options[0]
        };
        },
        methods: {
            close:function(){this.open = false;},
            toggle:function(){this.open = !this.open;},
            selectOption:function(option){
                this.selectedOption = option;
                this.changed();
                this.close();
            },
            changed:function(){ this.$emit('changed', this.selectedOption) }
        },
        props: ['options'],
        watch: { selectedOption: function(n,o) { this.changed(); } }
    };
</script>