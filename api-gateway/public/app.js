(() => {
  'use strict';

  const responseEl = document.getElementById('response');
  const logEl = document.getElementById('log');
  const toastContainer = document.getElementById('toast-container');
  const ratelimitSections = {
    '/api/products': {
      el: document.getElementById('ratelimit-products'),
      end: 0,
      timer: null,
    },
    '/api/users': {
      el: document.getElementById('ratelimit-users'),
      end: 0,
      timer: null,
    },
  };

  function showRatelimit(path) {
    const section = ratelimitSections[path];
    if (!section) return;
    if (!section.end) section.end = Date.now() + 15000;
    section.el.classList.remove('hidden');
    if (!section.timer) section.timer = setInterval(updateRatelimit, 1000, path);
    updateRatelimit(path);
  }

  function hideRatelimit(path) {
    const section = ratelimitSections[path];
    if (!section) return;
    section.el.textContent = '';
    section.el.classList.add('hidden');
    section.end = 0;
    if (section.timer) {
      clearInterval(section.timer);
      section.timer = null;
    }
  }

  async function updateRatelimit(path) {
    const section = ratelimitSections[path];
    const remaining = Math.max(0, Math.ceil((section.end - Date.now()) / 1000));
    if (remaining > 0) {
      section.el.textContent = `Rate limit: ${remaining}s`;
      return;
    }
    try {
      const res = await fetch(path);
      if (res.ok) {
        hideRatelimit(path);
      } else {
        section.end = Date.now() + 1000;
        updateRatelimit(path);
      }
    } catch {
      section.el.textContent = 'Rate limit: reintentando...';
    }
  }

  function now() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  function showToast(message, type = 'info') {
    const Toast = document.createElement('div');
    Toast.className = `toast toast-${type}`;
    Toast.textContent = message;
    toastContainer.appendChild(Toast);
    const remove = () => Toast.remove();
    setTimeout(() => {
      Toast.classList.add('hide');
      setTimeout(remove, 250);
    }, 3500);
    Toast.addEventListener('click', remove);
  }

  function getServerMessage(data, fallback) {
    if (!data) return fallback;
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(' · ');
    return fallback;
  }

  function render(data) {
    if (typeof data === 'string') {
      responseEl.textContent = data;
    } else {
      responseEl.textContent = JSON.stringify(data, null, 2);
    }
  }

  function addLog(entry) {
    const empty = logEl.querySelector('.log-empty');
    if (empty) empty.remove();

    const li = document.createElement('li');
    if (entry.error) li.classList.add('error');

    const time = document.createElement('span');
    time.className = 'time';
    time.textContent = `[${now()}]`;

    const path = document.createElement('span');
    path.textContent = ` ${entry.method} /api${entry.path} →`;

    const status = document.createElement('span');
    status.className = `status ${entry.error ? 'fail' : 'ok'}`;
    status.textContent = ` ${entry.status}`;

    const info = document.createElement('span');
    info.textContent = entry.error ? `  ${entry.error}` : '';

    li.append(time, path, status, info);
    logEl.prepend(li);
  }

  const successMessages = {
    POST: 'Producto creado correctamente',
    PUT: 'Producto actualizado correctamente',
    DELETE: 'Producto eliminado',
  };

  async function apiRequest(method, path, body, opts = {}) {
    const start = performance.now();
    try {
      const res = await fetch(`/api${path}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => null);
      const duration = Math.round(performance.now() - start);
      const isError = !res.ok;
      addLog({
        method,
        path,
        status: res.status,
        error: isError ? getServerMessage(data, 'Error') : undefined,
      });
      const durationNode = document.createTextNode(`  · ${duration}ms`);
      logEl.querySelector('li').append(durationNode);
      if (!isError) {
        render(data);
        const msg = opts.successMessage || successMessages[method];
        if (msg) showToast(msg, 'success');
        if (opts.clearPrefix) clearForm(opts.clearPrefix);
        hideRatelimit(`/api${path}`);
      } else {
        let message = getServerMessage(data, 'Ocurrió un error');
        if (/too many requests/i.test(message)) {
          message = 'Demasiadas peticiones seguidas (429). Espera unos 15 segundos y reintenta.';
          showRatelimit(`/api${path}`);
        }
        render({ status: res.status, ...(data ?? {}) });
        showToast(message, 'error');
      }
    } catch (err) {
      addLog({ method, path, status: 'RED', error: err.message || 'Fallo de red' });
      render({ error: err.message || 'Fallo de red' });
      showToast('No se pudo contactar al gateway', 'error');
    }
  }

  function clearForm(prefix) {
    ['name', 'desc', 'price', 'stock', 'id'].forEach((suffix) => {
      const el = document.getElementById(`${prefix}${suffix}`);
      if (el) el.value = '';
    });
  }

  function getNumber(id) {
    const value = parseInt(document.getElementById(id).value, 10);
    if (!value || value < 1) return null;
    return value;
  }

  document.getElementById('btn-health').addEventListener('click', () =>
    apiRequest('GET', '/health'),
  );

  document.getElementById('btn-list').addEventListener('click', () =>
    apiRequest('GET', '/products'),
  );

  document.getElementById('btn-get').addEventListener('click', () => {
    const id = getNumber('input-id');
    if (id === null) return showToast('Ingresa un ID válido', 'error');
    apiRequest('GET', `/products/${id}`);
  });

  document.getElementById('btn-delete').addEventListener('click', () => {
    const id = getNumber('input-id');
    if (id === null) return showToast('Ingresa un ID válido', 'error');
    apiRequest('DELETE', `/products/${id}`);
  });

  document.getElementById('btn-get-clear').addEventListener('click', () => {
    document.getElementById('input-id').value = '';
  });

  document.getElementById('btn-create').addEventListener('click', () => {
    const body = {
      name: document.getElementById('c-name').value.trim(),
      description: document.getElementById('c-desc').value.trim(),
      price: parseFloat(document.getElementById('c-price').value),
      stock: parseInt(document.getElementById('c-stock').value, 10),
    };
    if (!body.name || !body.description || isNaN(body.price) || isNaN(body.stock)) {
      return showToast('Completa todos los campos (nombre, descripción, precio y stock)', 'error');
    }
    apiRequest('POST', '/products', body);
  });

  document.getElementById('btn-update').addEventListener('click', () => {
    const id = getNumber('u-id');
    if (id === null) return showToast('Ingresa un ID válido', 'error');
    const body = {};
    const name = document.getElementById('u-name').value.trim();
    const price = parseFloat(document.getElementById('u-price').value);
    const stock = parseInt(document.getElementById('u-stock').value, 10);
    if (name) body.name = name;
    if (!isNaN(price)) body.price = price;
    if (!isNaN(stock)) body.stock = stock;
    apiRequest('PUT', `/products/${id}`, body);
  });

  document.getElementById('btn-users-list').addEventListener('click', () =>
    apiRequest('GET', '/users'),
  );

  document.getElementById('btn-user-get').addEventListener('click', () => {
    const id = getNumber('u-input-id');
    if (id === null) return showToast('Ingresa un ID válido', 'error');
    apiRequest('GET', `/users/${id}`);
  });

  document.getElementById('btn-user-get-clear').addEventListener('click', () => {
    document.getElementById('u-input-id').value = '';
  });

  document.getElementById('btn-user-create').addEventListener('click', () => {
    const body = {
      name: document.getElementById('u-c-name').value.trim(),
      email: document.getElementById('u-c-email').value.trim(),
    };
    if (!body.name || !body.email) {
      return showToast('Completa el nombre y el email del usuario', 'error');
    }
    apiRequest('POST', '/users', body, {
      successMessage: 'Usuario creado correctamente',
      clearPrefix: 'u-c-',
    });
  });

  async function runRateLimitDemo(path, total) {
    let ok = 0;
    let limited = 0;
    let other = 0;
    showToast(`Enviando ${total} peticiones seguidas a ${path}...`, 'info');
    for (let i = 0; i < total; i++) {
      try {
        const res = await fetch(path);
        if (res.status === 200) ok++;
        else if (res.status === 429) limited++;
        else other++;
      } catch {
        other++;
      }
    }
    addLog({
      method: 'GET',
      path: `${path} x${total}`,
      status: `200: ${ok}  ·  429: ${limited}${other ? `  ·  otro: ${other}` : ''}`,
    });
    render({
      rateLimitingDemo: {
        endpoint: path,
        peticiones: total,
        exitosas_200: ok,
        bloqueadas_429: limited,
        otras: other,
      },
    });
    if (limited > 0) {
      showRatelimit(path);
      showToast(
        `Rate limit: ${limited} de ${total} respondieron 429 Too Many Requests`,
        'success',
      );
    } else {
      showToast(
        'Todas pasaron. Baja el límite (THROTTLE_LIMIT o el de usuarios) para ver el bloqueo',
        'error',
      );
    }
  }

  document.getElementById('btn-spam').addEventListener('click', () =>
    runRateLimitDemo('/api/products', 40),
  );

  document.getElementById('btn-users-spam').addEventListener('click', () =>
    runRateLimitDemo('/api/users', 30),
  );
})();