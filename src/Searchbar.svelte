<script>
  import { createEventDispatcher } from "svelte";

  const dispatcher = createEventDispatcher();

  let inputText;

  const checkKey = e => {
    if (e.keyCode === 13) {
      e.preventDefault();
      process();
    }
  };

  const fetchRedditData = async subredditName => {
    if (subredditName) {
      const uri = `https://www.reddit.com/r/${subredditName}.json`;

      const response = await fetch(uri);
      const data = await response.json();
      return data;
    }
  };

  const getImportantDatapoints = entry => {
    return {
      title: entry.data.title,
      author: entry.data.author,
      preview: entry.data.thumbnail,
      upvotes: entry.data.ups,
      comments: entry.data.num_comments,
      url: entry.data.url
    };
  };

  const getNFormattedEntries = (totalEntries, numOfEntries) => {
    const relevant = [];

    let index = 0;
    let validEntries = 0;

    while (validEntries < numOfEntries) {
      const currentEntry = totalEntries.data.children[index];
      if (currentEntry.data.thumbnail != "self") {
        index++;
        validEntries++;
        relevant.push(getImportantDatapoints(currentEntry));
      } else {
        index++;
      }
    }
    return relevant;
  };

  const process = async () => {
    const fetchedData = await fetchRedditData(inputText);
    inputText = "";
    const entriesToDisplay = getNFormattedEntries(fetchedData, 6);
    dispatcher("displaydata", entriesToDisplay);
  };
</script>

<style>
  .searcharea {
    text-align: center;
    margin: 2rem;
  }

  input {
    width: 50vw;
    height: 4rem;
  }

  button {
    height: 4rem;
    width: 6rem;
  }
</style>

<div class="searcharea">
  <input
    type="text"
    bind:value={inputText}
    placeholder="Enter subreddit name here..."
    on:keyup={checkKey} />
  <button type="submit" on:click={process}>Submit</button>
</div>
