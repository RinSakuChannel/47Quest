(function () {
  'use strict';

  function shuffled(values, random = Math.random) {
    return values
      .map((value) => ({ value, order: random() }))
      .sort((a, b) => a.order - b.order)
      .map(({ value }) => value);
  }

  function draw(codes, savedDeck, count = 3, random = Math.random) {
    const valid = new Set(codes);
    let deck = Array.isArray(savedDeck)
      ? savedDeck.filter((code, index) => valid.has(code) && savedDeck.indexOf(code) === index)
      : [];
    const selected = [];

    while (selected.length < count) {
      if (!deck.length) deck = shuffled(codes, random).filter((code) => !selected.includes(code));
      const code = deck.shift();
      if (code && !selected.includes(code)) selected.push(code);
    }
    return { selected, deck };
  }

  window.QUEST_PREFECTURE_DECK = { draw };
}());
