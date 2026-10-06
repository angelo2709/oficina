const form = document.querySelector('#loginForm');
const errorBox = document.querySelector('#loginError');
(async () => {
  try {
    const response = await fetch('/api/session');
    const session = await response.json();
    if (session.authenticated) window.location.replace('/');
  } catch { errorBox.textContent = 'Não foi possível conectar ao servidor.'; }
})();
form.addEventListener('submit', async event => {
  event.preventDefault();
  errorBox.textContent = '';
  const data = Object.fromEntries(new FormData(form).entries());
  try {
    const response = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível entrar.');
    window.location.replace('/');
  } catch (error) { errorBox.textContent = error.message; }
});
