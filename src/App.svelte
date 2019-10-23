<script>
  import Header from "./Header.svelte";
  import Searchbar from "./Searchbar.svelte";
  import Card from "./Card.svelte";
  import RadioButtonRow from "./RadioButtonRow.svelte";

  let topRow = [];
  let bottomRow = [];

  const dataSplitter = e => {
    const data = e.detail;

    if (data.length % 2 == 0) {
      const halfPoint = data.length / 2;
      topRow = data.splice(0, halfPoint);
      bottomRow = data;
    }
  };
</script>

<style>
  .cardRow {
    display: flex;
    justify-content: space-around;
  }

  #bottomRow {
    margin-bottom: 3rem;
  }

  .radio-button-row {
    text-align: center;
    margin: -2rem;
  }
</style>

<Header />
<Searchbar on:displaydata={dataSplitter} />
<div class="radio-button-row">
  <RadioButtonRow class="radioButtonRow" />
</div>
<div id="topRow" class="cardRow">
  {#if topRow.length > 0}
    {#each topRow as post}
      <Card
        preview={post.preview}
        title={post.title}
        author={post.author}
        url={post.url}
        upvotes={post.upvotes}
        comments={post.comments} />
    {/each}
  {/if}
</div>
<div id="bottomRow" class="cardRow">
  {#if bottomRow.length > 0}
    {#each bottomRow as post}
      <Card
        preview={post.preview}
        title={post.title}
        author={post.author}
        url={post.url}
        upvotes={post.upvotes}
        comments={post.comments} />
    {/each}
  {/if}
</div>
