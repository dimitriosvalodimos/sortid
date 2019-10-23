<script>
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
  h3 {
    padding: 0.5rem;
  }

  hr {
    color: lightgray;
    width: 75%;
  }
</style>

<div class="card">
  <img src={preview} alt="" on:click={openLink} />
  <hr />
  <h3>{title}</h3>
  <!-- <hr /> -->
</div>
