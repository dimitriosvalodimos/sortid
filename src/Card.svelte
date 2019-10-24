<script>
  import { fly } from "svelte/transition";

  export let title;
  export let author;
  export let preview;
  export let url;
  export let upvotes;
  export let comments;

  const openLink = () => {
    window.open(url, "_blank");
  };
</script>

<style>
  .card {
    border: 1px lightgray solid;
    border-radius: 15px;
    display: inline-block;
    width: 27vw;
    text-align: center;
    margin-top: 2rem;
    margin-bottom: 2rem;
    position: relative;
  }

  img {
    padding: 2rem 0;
  }
  h4 {
    padding: 0 1rem;
  }

  hr {
    color: lightgray;
    width: 75%;
  }
</style>

<div class="card" transition:fly={{ y: 50, duration: 1000 }}>
  <img src={preview} alt="" on:click={openLink} />
  <hr />
  <h4>{title}</h4>
</div>
