// ==========================================
//  SnipURL — Application Logic
// ==========================================

// ---- DOM References ----
const DOM = {
  navbar: document.getElementById('navbar'),
  mobileBtn: document.getElementById('mobile-menu-btn'),
  mobileNav: document.getElementById('mobile-nav'),
  hamburger: document.getElementById('hamburger'),

  form: document.getElementById('shortener-form'),
  urlInput: document.getElementById('url-input'),
  inputGroup: document.getElementById('input-group'),
  submitBtn: document.getElementById('submit-btn'),
  btnText: document.getElementById('btn-text'),
  spinner: document.getElementById('loading-spinner'),
  successIcon: document.getElementById('success-icon'),
  errorMsg: document.getElementById('error-msg'),

  advToggle: document.getElementById('advanced-toggle'),
  advOptions: document.getElementById('advanced-options'),
  customAlias: document.getElementById('custom-alias'),

  resultCard: document.getElementById('result-card'),
  resOriginal: document.getElementById('res-original'),
  resShort: document.getElementById('res-short'),
  copyBtn: document.getElementById('copy-btn'),
  copyIcon: document.getElementById('copy-icon'),
  copyText: document.getElementById('copy-text'),
  qrBtn: document.getElementById('qr-btn'),

  historyList: document.getElementById('history-list'),
  emptyState: document.getElementById('empty-state'),
  clearBtn: document.getElementById('clear-history'),

  qrModal: document.getElementById('qr-modal'),
  qrModalClose: document.getElementById('qr-modal-close'),
  qrDisplay: document.getElementById('qr-display'),
  qrUrl: document.getElementById('qr-url'),
  qrDownload: document.getElementById('qr-download'),

  toastContainer: document.getElementById('toast-container'),
  particlesCanvas: document.getElementById('particles-canvas'),

  observers: document.querySelectorAll('.observe')
};

const STORAGE_KEY = 'snipurl_history';
let linksHistory = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

// ==========================================
//  1. Floating Particles
// ==========================================
function initParticles() {
  const canvas = DOM.particlesCanvas;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const particleCount = 50;
  let mouse = { x: null, y: null };

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  class Particle {
    constructor() {
      this.reset();
    }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.4 + 0.1;
    }
    update() {
      this.x += this.speedX;
      this.y += this.speedY;

      // Mouse interaction — subtle push
      if (mouse.x !== null) {
        const dx = this.x - mouse.x;
        const dy = this.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          const force = (120 - dist) / 120;
          this.x += (dx / dist) * force * 0.5;
          this.y += (dy / dist) * force * 0.5;
        }
      }

      if (this.x < 0 || this.x > canvas.width ||
          this.y < 0 || this.y > canvas.height) {
        this.reset();
      }
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 58, 237, ${this.opacity})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < particleCount; i++) {
    particles.push(new Particle());
  }

  function connectParticles() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 150) {
          ctx.beginPath();
          ctx.strokeStyle = `rgba(124, 58, 237, ${0.06 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.5;
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    connectParticles();
    requestAnimationFrame(animate);
  }
  animate();
}

initParticles();

// ==========================================
//  2. Toast Notification System
// ==========================================
function showToast(message, type = 'success') {
  const iconMap = {
    success: 'check-circle',
    error: 'alert-circle',
    info: 'info'
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <i data-lucide="${iconMap[type]}" class="toast-icon"></i>
    <span>${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);
  lucide.createIcons();

  setTimeout(() => {
    toast.classList.add('removing');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ==========================================
//  3. Navbar & Mobile Menu
// ==========================================
window.addEventListener('scroll', () => {
  DOM.navbar.classList.toggle('scrolled', window.scrollY > 50);
});

DOM.mobileBtn.addEventListener('click', () => {
  DOM.mobileNav.classList.toggle('active');
  DOM.hamburger.classList.toggle('active');
});

document.querySelectorAll('.mobile-nav-link, .mobile-cta').forEach(link => {
  link.addEventListener('click', () => {
    DOM.mobileNav.classList.remove('active');
    DOM.hamburger.classList.remove('active');
  });
});

// ==========================================
//  4. Advanced Options Toggle
// ==========================================
DOM.advToggle.addEventListener('click', () => {
  DOM.advToggle.classList.toggle('open');
  DOM.advOptions.classList.toggle('open');
});

// ==========================================
//  5. Intersection Observer (Scroll Animations & Counters)
// ==========================================
const countUp = (element, target) => {
  const duration = 2200;
  const startTime = performance.now();

  const updateCount = (currentTime) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeProgress = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    const current = Math.floor(easeProgress * target);

    element.innerText = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(updateCount);
    } else {
      element.innerText = target.toLocaleString() + '+';
    }
  };
  requestAnimationFrame(updateCount);
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');

      const numberEl = entry.target.querySelector('.stat-number');
      if (numberEl && !numberEl.hasAttribute('data-counted')) {
        const target = parseInt(numberEl.getAttribute('data-target'), 10);
        countUp(numberEl, target);
        numberEl.setAttribute('data-counted', 'true');
      }

      observer.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15,
  rootMargin: '0px 0px -60px 0px'
});

DOM.observers.forEach(el => observer.observe(el));

// ==========================================
//  6. URL Validation & Shortening
// ==========================================
const isValidUrl = (string) => {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
};

const generateShortCode = (length = 6) => {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Clear errors on input
DOM.urlInput.addEventListener('input', () => {
  DOM.inputGroup.classList.remove('error', 'success');
  DOM.errorMsg.classList.remove('show');
});

DOM.form.addEventListener('submit', (e) => {
  e.preventDefault();
  let url = DOM.urlInput.value.trim();

  if (!url) {
    triggerError();
    return;
  }

  // Prepend https if missing
  let validUrl = url;
  if (!/^https?:\/\//i.test(validUrl)) {
    validUrl = 'https://' + validUrl;
  }

  if (!isValidUrl(validUrl)) {
    triggerError();
    return;
  }

  DOM.inputGroup.classList.remove('error');
  DOM.inputGroup.classList.add('success');
  DOM.errorMsg.classList.remove('show');

  // Loading state
  DOM.btnText.classList.add('hidden');
  DOM.spinner.classList.remove('hidden');
  DOM.submitBtn.style.pointerEvents = 'none';
  DOM.resultCard.classList.add('hidden');

  // Simulate API Call
  setTimeout(() => {
    DOM.spinner.classList.add('hidden');
    DOM.successIcon.classList.remove('hidden');

    const custom = DOM.customAlias.value.trim();
    const shortCode = custom || generateShortCode();
    const shortUrl = `snip.it/${shortCode}`;

    // Display Result
    DOM.resOriginal.textContent = validUrl;
    DOM.resShort.textContent = shortUrl;
    DOM.resShort.href = validUrl;
    DOM.resultCard.classList.remove('hidden');

    // Save to History
    saveToHistory({
      original: validUrl,
      short: shortUrl,
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    });

    showToast('Link shortened successfully!', 'success');

    // Reset form button after brief pause
    setTimeout(() => {
      DOM.successIcon.classList.add('hidden');
      DOM.btnText.classList.remove('hidden');
      DOM.submitBtn.style.pointerEvents = 'auto';
      DOM.urlInput.value = '';
      DOM.customAlias.value = '';
      DOM.inputGroup.classList.remove('success');
    }, 2000);

  }, 1000);
});

function triggerError() {
  DOM.inputGroup.classList.remove('success');
  DOM.inputGroup.classList.add('error');
  DOM.errorMsg.classList.add('show');
  // Re-trigger shake
  DOM.inputGroup.style.animation = 'none';
  DOM.inputGroup.offsetHeight;
  DOM.inputGroup.style.animation = null;
  showToast('Please enter a valid URL', 'error');
}

// ==========================================
//  7. Copy to Clipboard
// ==========================================
const copyToClipboard = async (text, btnElement, iconElement, textElement) => {
  try {
    await navigator.clipboard.writeText(text);
    const originalIcon = iconElement.getAttribute('data-lucide');
    iconElement.setAttribute('data-lucide', 'check');
    if (textElement) textElement.textContent = 'Copied!';
    btnElement.classList.add('copied');
    lucide.createIcons();

    showToast('Copied to clipboard!', 'success');

    setTimeout(() => {
      iconElement.setAttribute('data-lucide', originalIcon);
      if (textElement) textElement.textContent = 'Copy';
      btnElement.classList.remove('copied');
      lucide.createIcons();
    }, 2000);
  } catch (err) {
    // Fallback for older browsers
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showToast('Copied to clipboard!', 'info');
  }
};

DOM.copyBtn.addEventListener('click', () => {
  copyToClipboard(DOM.resShort.textContent, DOM.copyBtn, DOM.copyIcon, DOM.copyText);
});

// ==========================================
//  8. QR Code Generation
// ==========================================
function generateQRCode(text) {
  // Simple QR code using a canvas-based approach via Google Chart API as a fallback
  DOM.qrDisplay.innerHTML = '';
  const img = document.createElement('img');
  img.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(text)}&bgcolor=ffffff&color=7c3aed`;
  img.alt = 'QR Code for ' + text;
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'contain';
  img.style.borderRadius = '8px';
  DOM.qrDisplay.appendChild(img);
  DOM.qrUrl.textContent = text;
}

DOM.qrBtn.addEventListener('click', () => {
  const shortUrl = DOM.resShort.textContent;
  generateQRCode('https://' + shortUrl);
  DOM.qrModal.classList.remove('hidden');
});

DOM.qrModalClose.addEventListener('click', () => {
  DOM.qrModal.classList.add('hidden');
});

DOM.qrModal.addEventListener('click', (e) => {
  if (e.target === DOM.qrModal) {
    DOM.qrModal.classList.add('hidden');
  }
});

DOM.qrDownload.addEventListener('click', () => {
  const img = DOM.qrDisplay.querySelector('img');
  if (img) {
    const a = document.createElement('a');
    a.href = img.src;
    a.download = `snipurl-qr-${Date.now()}.png`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('QR Code downloading...', 'info');
  }
});

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !DOM.qrModal.classList.contains('hidden')) {
    DOM.qrModal.classList.add('hidden');
  }
});

// ==========================================
//  9. History Management
// ==========================================
const renderHistory = () => {
  DOM.historyList.innerHTML = '';

  if (linksHistory.length === 0) {
    DOM.emptyState.classList.remove('hidden');
    DOM.historyList.classList.add('hidden');
    DOM.clearBtn.classList.add('hidden');
    return;
  }

  DOM.emptyState.classList.add('hidden');
  DOM.historyList.classList.remove('hidden');
  DOM.clearBtn.classList.remove('hidden');

  linksHistory.forEach((link, index) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.id = `link-${link.id}`;
    item.style.animationDelay = `${index * 0.06}s`;

    item.innerHTML = `
      <div class="history-item-info">
        <a href="${link.original}" target="_blank" class="history-item-short">${link.short}</a>
        <span class="history-item-original" title="${link.original}">${link.original}</span>
        ${link.date ? `<span class="history-item-date">${link.date}</span>` : ''}
      </div>
      <div class="history-item-actions">
        <button class="btn btn-icon copy-history" data-text="${link.short}" aria-label="Copy">
          <i data-lucide="copy"></i>
        </button>
        <button class="btn btn-icon delete-history" data-id="${link.id}" aria-label="Delete">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;
    DOM.historyList.appendChild(item);
  });

  lucide.createIcons();

  // Attach event listeners
  document.querySelectorAll('.copy-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const text = e.currentTarget.getAttribute('data-text');
      const icon = e.currentTarget.querySelector('i');
      copyToClipboard(text, e.currentTarget, icon, null);
    });
  });

  document.querySelectorAll('.delete-history').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const id = e.currentTarget.getAttribute('data-id');
      const element = document.getElementById(`link-${id}`);
      element.classList.add('removing');

      setTimeout(() => {
        linksHistory = linksHistory.filter(l => l.id !== id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(linksHistory));
        renderHistory();
        showToast('Link removed', 'info');
      }, 350);
    });
  });
};

const saveToHistory = (linkObj) => {
  linksHistory.unshift(linkObj);
  if (linksHistory.length > 15) {
    linksHistory.pop();
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(linksHistory));
  renderHistory();
};

DOM.clearBtn.addEventListener('click', () => {
  linksHistory = [];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(linksHistory));
  renderHistory();
  showToast('All links cleared', 'info');
});

// ==========================================
//  10. Smooth Scroll for CTA "Get Started"
// ==========================================
document.querySelectorAll('.nav-cta').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.preventDefault();
    DOM.urlInput.focus();
    DOM.urlInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// ==========================================
//  Init
// ==========================================
renderHistory();
