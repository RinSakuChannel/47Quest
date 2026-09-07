// Every prefecture has a verified individual high-resolution cutout.
window.CHARACTER_ART = Object.fromEntries(
  Array.from({length:47}, (_, index) => {
    const code=String(index + 1).padStart(2, '0');
    return [code, `./assets/characters/v3/${code}.webp`];
  })
);
// Material-grown anatomy and gentler personalities; keep successful v3 art.
for (const code of ['17','25','28','39','43','47']) {
  window.CHARACTER_ART[code] = `./assets/characters/v4/${code}.webp`;
}
