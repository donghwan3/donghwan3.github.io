const copyButton = document.querySelector('#copy-bibtex');
copyButton?.addEventListener('click', async () => {
  const citation = document.querySelector('#citation');
  const status = document.querySelector('#copy-status');
  try {
    await navigator.clipboard.writeText(citation.textContent);
    status.textContent = document.documentElement.lang==='ko'?'BibTeX를 복사했습니다.':'BibTeX copied.';
  } catch {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(citation);
    selection.removeAllRanges();
    selection.addRange(range);
    status.textContent = document.documentElement.lang==='ko'?'인용 정보를 선택했습니다. Ctrl+C(Windows) 또는 Command+C(Mac)로 복사하세요.':'Citation selected. Press Ctrl+C (Windows) or Command+C (Mac) to copy.';
  }
});
