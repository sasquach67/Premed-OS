(function () {
  'use strict';
  // Anki reuses the reviewer window between cards. Remove the prior card's hooks.
  var cleanupKey = '__premedosListRevealCleanup';
  if (typeof window[cleanupKey] === 'function') window[cleanupKey]();
  var root = document.getElementById('pm-list-question');
  if (!root) return;
  var label = root.querySelector('.verb');
  if (!label || label.textContent.trim().toLowerCase() !== 'list') return;
  var blanks = Array.prototype.slice.call(root.querySelectorAll('.cloze[data-cloze]'));
  // Older clients omit data-cloze. Leave their ordinary cloze question untouched.
  if (!blanks.length || blanks.some(function (blank) { return !blank.getAttribute('data-cloze'); })) return;
  var next = 0;
  var button = document.createElement('button');
  button.type = 'button';
  button.className = 'pm-list-reveal';
  button.textContent = 'Reveal next';
  button.setAttribute('aria-label', 'Reveal next list item');
  var status = document.createElement('span');
  status.className = 'pm-list-reveal-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');
  var controls = document.createElement('div');
  controls.className = 'pm-list-reveal-controls';
  controls.appendChild(button);
  controls.appendChild(status);
  root.appendChild(controls);

  function reveal() {
    if (!root.isConnected || next >= blanks.length) return false;
    var blank = blanks[next++];
    blank.innerHTML = blank.getAttribute('data-cloze');
    blank.classList.add('pm-list-revealed');
    status.textContent = ' ' + next + ' of ' + blanks.length + ' revealed';
    if (next === blanks.length) {
      button.disabled = true;
      button.textContent = 'All items revealed';
    }
    return true;
  }
  function interactive(target) {
    var element = target && target.nodeType === 1 ? target : target && target.parentElement;
    if (!element) return false;
    return element !== button && !!element.closest('a, button, input, textarea, select, summary, [contenteditable="true"], [role="button"]');
  }
  function click(event) {
    if (!interactive(event.target)) reveal();
  }
  function key(event) {
    if (event.repeat || event.altKey || event.ctrlKey || event.metaKey || interactive(event.target)) return;
    if ([' ', 'Spacebar', 'Enter', 'ArrowRight', 'n', 'N'].indexOf(event.key) === -1) return;
    if (reveal()) {
      event.preventDefault();
      event.stopPropagation();
    }
  }
  // A browser's synthesized click handles mouse, touch and assistive activation.
  // Registering touchend as well would advance twice for a single mobile tap.
  root.addEventListener('click', click);
  document.addEventListener('keydown', key, true);
  var observer = new MutationObserver(function () {
    if (!root.isConnected) cleanup();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  function cleanup() {
    root.removeEventListener('click', click);
    document.removeEventListener('keydown', key, true);
    observer.disconnect();
    controls.remove();
    if (window[cleanupKey] === cleanup) delete window[cleanupKey];
  }
  window[cleanupKey] = cleanup;
})();
