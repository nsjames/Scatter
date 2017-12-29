module.exports = `
<section class="keychain-component">
    <section class="dashboard">
        <section class="dup">
            <figure class="lock" v-on:click="lock"><i class="fa fa-unlock-alt"></i></figure>
            <figure class="wallet-name">Test Wallet</figure>
            <figure class="truncated-key">0x8eD...Ds21</figure>
            <section class="send-recv">
                <figure>Send</figure>
                <figure>Recv</figure>
            </section>
        </section>
        <section class="ddown">
            <section class="fifty">
                <p class="blue"><b>EOS</b><span>119.16424</span></p>
                <p><b>USD</b><span>987.24</span></p>
            </section>
            <section class="fifty">
                <section class="list-switch" :class="{'active':listState==='history'}" v-on:click="toggleListState"><i class="fa fa-history"></i></section>
                <section class="list-switch" :class="{'active':listState==='domains'}" v-on:click="toggleListState"><i class="fa fa-globe"></i></section>
            </section>
        </section>
    </section>
    <section class="data-list">
        <section class="item" v-for="listItem in listItems">
            <figure class="fifty">
                <figure class="title">May 22nd, 2017</figure>
                <figure class="sub-title">forseen.com</figure>
            </figure>
            <figure class="fifty">
                <figure class="coin">EOS</figure>
                <figure class="amount">0.004854</figure>
            </figure>
        </section>
    </section>
</section>
`;