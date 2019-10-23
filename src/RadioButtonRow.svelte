<script>
  import RadioButton from "./RadioButton.svelte";

  const radioOptions = [
    {
      name: "Hot",
      id: "hot",
      value: "Hot"
    },
    {
      name: "Top",
      id: "top",
      value: "Top"
    },
    {
      name: "New",
      id: "new",
      value: "New"
    }
  ];
</script>

<style>
  .radio-row {
    border: solid 3px #675f6b;
    display: inline-block;
    margin: 20px;
    border-radius: 10px;
    overflow: hidden;
  }
</style>

<form>
  <div class="radio-row">
    {#each radioOptions as radio}
      <RadioButton name={radio.name} id={radio.id} value={radio.value} />
    {/each}
  </div>
</form>
