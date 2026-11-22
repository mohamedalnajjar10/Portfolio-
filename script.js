const filterBar = document.querySelector('.filter-bar');
if (filterBar) {
  const filters = [...filterBar.querySelectorAll('[data-filter]')];
  const cards = [...document.querySelectorAll('.project-card')];
  const count = filterBar.querySelector('.project-count');
  for (const selected of filters) {
    selected.addEventListener('click', () => {
      for (const filter of filters) {
        filter.setAttribute('aria-pressed', String(filter === selected));
      }
      let shown = 0;
      for (const card of cards) {
        const matches = selected.dataset.filter === 'all' || selected.dataset.filter === card.dataset.category;
        card.hidden = !matches;
        if (matches) shown++;
      }
      count.textContent = shown === 1 ? '1 project' : shown + ' projects';
    });
  }
  filterBar.hidden = false;
}

// Add a project slug here once its image has been placed in imgs/projects.
const projectsWithImages = new Set([]);
for (const slot of document.querySelectorAll('[data-image-slot]')) {
  if (!projectsWithImages.has(slot.dataset.imageSlot)) continue;
  const image = slot.querySelector('template').content.querySelector('img').cloneNode();
  image.addEventListener('error', () => image.remove(), { once: true });
  slot.append(image);
}
