// Runs before first paint (loaded synchronously from <head>) so there is no light/dark flash.
// It is an external file because the CSP forbids inline scripts.
(function () {
  try {
    var m = localStorage.getItem('recursio-theme');
    var dark = m === 'dark' || ((m === null || m === 'system') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) { /* storage blocked: fall back to light */ }
})();
