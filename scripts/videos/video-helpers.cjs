// Browser library JavaScript extension used only to record the documentation
// videos: Playwright's screen recording shows no mouse pointer, so a page
// script draws one, with a ripple on every click.

const INIT_SCRIPT = `(() => {
  // The recorder toolbar lives in a closed shadow root; keep a handle so the
  // video script can find its buttons.
  const attach = Element.prototype.attachShadow;
  Element.prototype.attachShadow = function (init) {
    const root = attach.call(this, init);
    if (this.localName === 'rfb-recorder-toolbar') window.toolbarRoot = root;
    return root;
  };
  // Park the recorder toolbar in the bottom right corner, out of the page's way.
  try {
    if (!sessionStorage.getItem('rfb.toolbar.position'))
      sessionStorage.setItem('rfb.toolbar.position', JSON.stringify(__POSITION__));
  } catch (e) {}
  const install = () => {
    const cursor = document.createElement('div');
    cursor.id = 'video-cursor';
    cursor.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24"><path d="M4 2l15 10-7 1.5L8.5 21z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    cursor.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;transform:translate(-100px,-100px);transition:none;filter:drop-shadow(0 1px 2px rgb(0 0 0 / 40%))';
    document.documentElement.appendChild(cursor);
    window.addEventListener('mousemove', (e) => {
      cursor.style.transform = 'translate(' + (e.clientX - 3) + 'px,' + (e.clientY - 2) + 'px)';
    }, true);
    window.addEventListener('mousedown', (e) => {
      const ripple = document.createElement('div');
      ripple.style.cssText = 'position:fixed;z-index:2147483646;pointer-events:none;width:34px;height:34px;border-radius:50%;border:3px solid #ff6b5e;left:' + (e.clientX - 17) + 'px;top:' + (e.clientY - 17) + 'px;opacity:.9;transition:transform .45s ease-out,opacity .45s ease-out';
      document.documentElement.appendChild(ripple);
      requestAnimationFrame(() => { ripple.style.transform = 'scale(1.8)'; ripple.style.opacity = '0'; });
      setTimeout(() => ripple.remove(), 500);
    }, true);
  };
  if (document.documentElement) install();
  else document.addEventListener('DOMContentLoaded', install);
})();`;

async function addVideoHelpers(toolbarX, toolbarY, context) {
    const position = JSON.stringify({ x: Number(toolbarX), y: Number(toolbarY) });
    await context.addInitScript(INIT_SCRIPT.replace('__POSITION__', position));
}

exports.__esModule = true;
exports.addVideoHelpers = addVideoHelpers;
