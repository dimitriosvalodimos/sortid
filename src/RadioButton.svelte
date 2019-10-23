<script>
  export let name;
  export let value;
  export let id;
</script>

<style>
  input[type="radio"] {
    position: absolute;
    visibility: hidden;
    display: none;
  }

  label {
    color: #9a929e;
    display: inline-block;
    cursor: pointer;
    font-weight: bold;
    padding: 5px 20px;
  }

  input[type="radio"]:checked + label {
    color: #ccc8ce;
    background: #675f6b;
  }
</style>

<input type="radio" {value} {id} name="selector" />
<label for={id}>{name}</label>
