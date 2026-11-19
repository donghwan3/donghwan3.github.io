const copyButton = document.querySelector('#copy-bibtex');
copyButton?.addEventListener('click', async () => {
  const citation = document.querySelector('#citation');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(citation.textContent);
    status.textContent = 'BibTeX copied.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(citation);
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = 'Citation selected. Press Ctrl+C (Windows) or Command+C (Mac) to copy.';
  }
});
