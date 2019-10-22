<script>
  export let title;
  export let author;
  export let preview;
  export let url;
  export let upvotes;
  export let comments;
</script>

<style>
  div {
    border: 1px black solid;
    border-radius: 15px;
    display: inline-block;
    width: 27vw;
    text-align: center;
  }
</style>

<div>
  <img src={preview} alt="" />
  <h3>{title}</h3>
</div>
