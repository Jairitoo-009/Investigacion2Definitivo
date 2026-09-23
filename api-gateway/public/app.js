(() => {
  'use strict';

  const responseEl = document.getElementById('response');
  const logEl = document.getElementById('log');
  const toastContainer = document.getElementById('toast-container');

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

  async function apiRequest(method, path, body) {
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
        if (successMessages[method]) {
          showToast(successMessages[method], 'success');
        }
        if (method === 'POST') clearForm('c-');
      } else {
        render({ status: res.status, ...(data ?? {}) });
        showToast(getServerMessage(data, 'Ocurrió un error'), 'error');
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
})();