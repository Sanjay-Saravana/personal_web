const SUPABASE_CONFIG = window.__SUPABASE_CONFIG || null;

const getSupabaseClient = () => {
  if (!window.supabase || !SUPABASE_CONFIG?.url || !SUPABASE_CONFIG?.anonKey) {
    return null;
  }
  return window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
};

const applyTheme = (theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
  const toggle = document.getElementById('theme-toggle');
  if (toggle) toggle.textContent = theme === 'dark' ? '🌙' : '☀️';
};

const setupThemeToggle = () => {
  const saved = localStorage.getItem('theme') || 'light';
  applyTheme(saved);
  const toggle = document.getElementById('theme-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  });
};

const setupNavigation = () => {
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    navLinks.classList.toggle('open');
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menuToggle.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('open');
    });
  });
};

const setupReveal = () => {
  const reveals = document.querySelectorAll('.reveal');
  if (!reveals.length) return;

  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    },
    { threshold: 0.1 }
  );

  reveals.forEach((section) => revealObserver.observe(section));
};

const animateSingleCounter = (element, target) => {
  const duration = 900;
  let start = null;
  const suffix = element.dataset.suffix || (target === 100 ? '%' : '+');

  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const value = Math.floor(progress * target);
    element.textContent = `${value}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      element.textContent = `${target}${suffix}`;
    }
  };

  requestAnimationFrame(step);
};

const animateCountersOnView = () => {
  const metrics = document.querySelectorAll('.metric-number');
  if (!metrics.length) return;

  const metricObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = Number(entry.target.dataset.target || 0);
          animateSingleCounter(entry.target, target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  metrics.forEach((metric) => metricObserver.observe(metric));
};

const stripHtml = (html) => {
  const temp = document.createElement('div');
  temp.innerHTML = html;
  return (temp.textContent || temp.innerText || '').trim();
};

const renderItems = (containerId, rows) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = '<p class="small-note">No items yet. Add entries from admin panel.</p>';
    return;
  }

  container.innerHTML = rows
    .map((row) => {
      const htmlBody = row.description_html || row.description || '';
      return `
      <div class="list-item">
        <h4>${row.title}</h4>
        <div class="rich-content">${htmlBody}</div>
        ${row.url ? `<a href="${row.url}" target="_blank" rel="noreferrer">Visit ↗</a>` : ''}
      </div>`;
    })
    .join('');
};

const setPortfolioCounts = (data) => {
  const typeMap = {
    web_apps: 'count-web-apps',
    projects: 'count-projects',
    python_packages: 'count-python-packages',
  };

  Object.entries(typeMap).forEach(([type, id]) => {
    const count = data.filter((item) => item.type === type).length;
    const el = document.getElementById(id);
    if (!el) return;
    el.dataset.target = String(count);
    el.dataset.suffix = '+';
    animateSingleCounter(el, count);
  });
};

const loadPortfolioData = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    renderItems('web-apps', []);
    renderItems('projects', []);
    renderItems('python-packages', []);
    setPortfolioCounts([]);
    return;
  }

  const { data, error } = await supabase.from('portfolio_items').select('*').order('created_at', { ascending: false });

  if (error || !data) {
    renderItems('web-apps', []);
    renderItems('projects', []);
    renderItems('python-packages', []);
    setPortfolioCounts([]);
    return;
  }

  renderItems('web-apps', data.filter((item) => item.type === 'web_apps'));
  renderItems('projects', data.filter((item) => item.type === 'projects'));
  renderItems('python-packages', data.filter((item) => item.type === 'python_packages'));
  setPortfolioCounts(data);
};

const setupParticles = () => {
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas?.getContext('2d');
  if (!canvas || !ctx) return;

  let particles = [];

  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };

  const createParticles = () => {
    const count = Math.floor(window.innerWidth / 22);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
    }));
  };

  const renderParticles = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(34, 211, 238, 0.5)';

    particles.forEach((particle) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
      if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    requestAnimationFrame(renderParticles);
  };

  window.addEventListener('resize', () => {
    resizeCanvas();
    createParticles();
  });

  resizeCanvas();
  createParticles();
  renderParticles();
};

const setupEditorToolbars = () => {
  document.querySelectorAll('.editor-toolbar').forEach((toolbar) => {
    const editorId = toolbar.dataset.for;
    const editor = document.getElementById(editorId);
    if (!editor) return;

    toolbar.querySelectorAll('button[data-cmd]').forEach((btn) => {
      btn.addEventListener('click', () => {
        editor.focus();
        const cmd = btn.dataset.cmd;
        const value = btn.dataset.value || null;
        if (cmd === 'insertLineBreak') {
          document.execCommand('insertLineBreak');
          return;
        }
        document.execCommand(cmd, false, value);
      });
    });
  });
};

const renderAdminItems = (items) => {
  const adminList = document.getElementById('admin-item-list');
  if (!adminList) return;

  if (!items.length) {
    adminList.innerHTML = '<p class="small-note">No saved items yet.</p>';
    return;
  }

  adminList.innerHTML = items
    .map(
      (item) => `
      <div class="list-item admin-row" data-id="${item.id}">
        <h4>${item.title} <small>(${item.type})</small></h4>
        <div class="rich-content">${item.description_html || item.description || ''}</div>
        <div class="row-actions">
          <button class="btn btn-secondary" type="button" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="btn btn-secondary" type="button" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </div>`
    )
    .join('');
};

const fillFormForEdit = (item) => {
  const form = document.querySelector(`.portfolio-form[data-type='${item.type}']`);
  if (!form) return;

  form.querySelector("input[name='item-id']").value = item.id;
  form.querySelector("input[name='title']").value = item.title || '';
  form.querySelector("input[name='url']").value = item.url || '';
  const editor = form.querySelector('.rich-editor');
  if (editor) editor.innerHTML = item.description_html || item.description || '';
};

const resetForm = (form) => {
  form.querySelector("input[name='item-id']").value = '';
  form.querySelector("input[name='title']").value = '';
  form.querySelector("input[name='url']").value = '';
  const editor = form.querySelector('.rich-editor');
  if (editor) editor.innerHTML = '';
};

const setupAdmin = () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  const adminTools = document.getElementById('admin-tools');
  const message = document.getElementById('admin-message');
  const supabase = getSupabaseClient();
  let adminItems = [];

  setupEditorToolbars();

  if (!supabase) {
    message.textContent = 'Create supabase-config.js (not committed) from supabase-config.example.js to enable admin login.';
    return;
  }

  const refreshAdminItems = async () => {
    const { data, error } = await supabase.from('portfolio_items').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      message.textContent = 'Failed to load admin items.';
      return;
    }
    adminItems = data;
    renderAdminItems(adminItems);
  };

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(loginForm);
    const email = formData.get('email');
    const password = formData.get('password');

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      message.textContent = `Login failed: ${error.message}`;
      return;
    }

    adminTools.hidden = false;
    loginForm.hidden = true;
    message.textContent = 'Login successful. CRUD access enabled.';
    await refreshAdminItems();
  });

  document.querySelectorAll('.portfolio-form').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const type = form.dataset.type;
      const id = form.querySelector("input[name='item-id']").value;
      const title = form.querySelector("input[name='title']").value;
      const url = form.querySelector("input[name='url']").value || null;
      const editor = form.querySelector('.rich-editor');
      const descriptionHtml = editor?.innerHTML || '';

      const payload = {
        type,
        title,
        url,
        description: stripHtml(descriptionHtml),
        description_html: descriptionHtml,
      };

      let response;
      if (id) {
        response = await supabase.from('portfolio_items').update(payload).eq('id', id);
      } else {
        response = await supabase.from('portfolio_items').insert(payload);
      }

      if (response.error) {
        message.textContent = `Save failed: ${response.error.message}`;
        return;
      }

      resetForm(form);
      message.textContent = id ? 'Item updated.' : 'Item created.';
      await refreshAdminItems();
    });

    form.querySelector("button[data-action='cancel-edit']").addEventListener('click', () => resetForm(form));
  });

  document.getElementById('admin-item-list')?.addEventListener('click', async (event) => {
    const target = event.target;
    const action = target.dataset.action;
    const id = Number(target.dataset.id);
    if (!action || !id) return;

    if (action === 'edit') {
      const item = adminItems.find((entry) => entry.id === id);
      if (!item) return;
      fillFormForEdit(item);
      message.textContent = `Editing: ${item.title}`;
      return;
    }

    if (action === 'delete') {
      const { error } = await supabase.from('portfolio_items').delete().eq('id', id);
      if (error) {
        message.textContent = `Delete failed: ${error.message}`;
        return;
      }
      message.textContent = 'Item deleted.';
      await refreshAdminItems();
    }
  });
};

setupThemeToggle();
setupNavigation();
setupReveal();
animateCountersOnView();
setupParticles();
loadPortfolioData();
setupAdmin();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
