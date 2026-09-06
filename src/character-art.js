// Every prefecture has a verified individual high-resolution cutout.
window.CHARACTER_ART = Object.fromEntries(
  Array.from({length:47}, (_, index) => {
    const code=String(index + 1).padStart(2, '0');
    return [code, `./assets/characters/v3/${code}.webp`];
  })
);
