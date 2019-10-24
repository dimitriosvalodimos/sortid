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
    animation: slide-down 1.5s ease;
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

  @keyframes slide-down {
    0% {
      opacity: 0;
      transform: translateY(-20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }
</style>

<div class="card">
  <img src={preview} alt="" on:click={openLink} />
  <hr />
  <h4>{title}</h4>
  <!-- <hr /> -->
</div>
