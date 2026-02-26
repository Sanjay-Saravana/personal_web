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

const animateCounters = () => {
  const metrics = document.querySelectorAll('.metric-number');
  if (!metrics.length) return;

  const animateCounter = (element) => {
    const target = Number(element.dataset.target);
    const duration = 1200;
    let start = null;

    const step = (timestamp) => {
      if (!start) start = timestamp;
      const progress = Math.min((timestamp - start) / duration, 1);
      const value = Math.floor(progress * target);
      element.textContent = `${value}${target === 100 ? '%' : '+'}`;
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        element.textContent = `${target}${target === 100 ? '%' : '+'}`;
      }
    };

    requestAnimationFrame(step);
  };

  const metricObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  metrics.forEach((metric) => metricObserver.observe(metric));
};

const renderItems = (containerId, rows) => {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!rows.length) {
    container.innerHTML = '<p class="small-note">No items yet. Add entries from admin panel.</p>';
    return;
  }

  container.innerHTML = rows
    .map(
      (row) => `
      <div class="list-item">
        <h4>${row.title}</h4>
        <p>${row.description}</p>
        ${row.url ? `<a href="${row.url}" target="_blank" rel="noreferrer">Visit ↗</a>` : ''}
      </div>`
    )
    .join('');
};

const loadPortfolioData = async () => {
  const supabase = getSupabaseClient();
  if (!supabase) {
    renderItems('web-apps', []);
    renderItems('projects', []);
    renderItems('python-packages', []);
    return;
  }

  const { data, error } = await supabase.from('portfolio_items').select('*').order('created_at', { ascending: false });

  if (error) {
    renderItems('web-apps', []);
    renderItems('projects', []);
    renderItems('python-packages', []);
    return;
  }

  renderItems('web-apps', data.filter((item) => item.type === 'web_apps'));
  renderItems('projects', data.filter((item) => item.type === 'projects'));
  renderItems('python-packages', data.filter((item) => item.type === 'python_packages'));
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
    ctx.fillStyle = 'rgba(34, 211, 238, 0.55)';

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

const setupAdmin = () => {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  const adminTools = document.getElementById('admin-tools');
  const message = document.getElementById('admin-message');
  const supabase = getSupabaseClient();

  if (!supabase) {
    message.textContent = 'Create supabase-config.js (not committed) from supabase-config.example.js to enable admin login.';
    return;
  }

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
    message.textContent = 'Login successful. You can now add portfolio entries.';
    loginForm.hidden = true;
  });

  document.querySelectorAll('.admin-form[data-type]').forEach((form) => {
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const payload = {
        type: form.dataset.type,
        title: formData.get('title'),
        description: formData.get('description'),
        url: formData.get('url') || null,
      };

      const { error } = await supabase.from('portfolio_items').insert(payload);

      if (error) {
        message.textContent = `Could not save entry: ${error.message}`;
        return;
      }

      form.reset();
      message.textContent = 'Saved successfully.';
    });
  });
};

setupThemeToggle();
setupNavigation();
setupReveal();
animateCounters();
setupParticles();
loadPortfolioData();
setupAdmin();

const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();
