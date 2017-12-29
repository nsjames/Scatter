module.exports = `
<section class="select" :class="{'open':open}">
  <figure class="item" v-on:click="toggle">{{selectedOption}}</figure>
  <figure class="arrow" v-on:click="toggle"><i class="fa fa-caret-down"></i></figure>

  <section class="options" :class="{'show':open}">
    <figure class="item" v-on:click="selectOption(option)" v-for="option in options">{{option}}</figure>
  </section>
</section>
`;