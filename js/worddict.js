/** Open-source Scrabble dictionary loader (redbo/scrabble, MIT). */
window.WordDict = (function () {
  "use strict";
  let set = null;
  let loadPromise = null;

  function dictUrl() {
    const s = document.querySelector('script[src*="worddict.js"]');
    if (s && s.src) return s.src.replace(/worddict\.js.*$/, "bg-words.txt");
    return "js/bg-words.txt";
  }

  function load() {
    if (set) return Promise.resolve(set);
    if (loadPromise) return loadPromise;
    loadPromise = fetch(dictUrl())
      .then(function (r) {
        if (!r.ok) throw new Error("word list fetch failed");
        return r.text();
      })
      .then(function (text) {
        set = new Set(text.trim().split("\n"));
        return set;
      })
      .catch(function () {
        set = new Set(["aa", "ab", "ad", "am", "an", "as", "at", "be", "by", "do", "go", "he", "if", "in", "is", "it", "me", "my", "no", "of", "on", "or", "so", "to", "up", "us", "we", "the", "and", "for", "are", "but", "not", "you", "all", "can", "had", "her", "was", "one", "our", "out", "day", "get", "has", "him", "his", "how", "man", "new", "now", "old", "see", "two", "way", "who", "boy", "did", "its", "let", "put", "say", "she", "too", "use", "word", "game", "play", "tile", "banana"]);
        return set;
      });
    return loadPromise;
  }

  return {
    load: load,
    ready: function () { return !!set; },
    has: function (word) {
      return set ? set.has(String(word).toLowerCase()) : false;
    }
  };
})();
