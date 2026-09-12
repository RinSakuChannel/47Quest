// Every prefecture has its own uncanny, region-specific character cutout.
window.CHARACTER_ART = Object.fromEntries(
  Array.from({length:47}, (_, index) => {
    const code=String(index + 1).padStart(2, '0');
    return [code, `./assets/characters/v3/${code}.webp`];
  })
);
// Ten characters passed the later material/anatomy revision; keep the other
// successful v3 creatures instead of replacing the cast with one template.
for (const code of ['04','17','19','22','25','28','31','39','43','47']) {
  window.CHARACTER_ART[code] = `./assets/characters/v4/${code}.webp`;
}
