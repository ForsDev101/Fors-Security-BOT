async function loadBans() {
  const pass = document.getElementById('pass').value;
  const res = await fetch('/api/banned', {
    headers: { 'Authorization': pass }
  });

  const list = await res.json();
  const ul = document.getElementById('banList');
  ul.innerHTML = '';

  list.forEach(user => {
    const li = document.createElement('li');
    li.innerHTML = `${user.id} - ${user.reason} - ${user.time} <button onclick="unban('${user.id}')">UNBAN</button>`;
    ul.appendChild(li);
  });
}

async function unban(id) {
  const pass = document.getElementById('pass').value;
  await fetch('/api/unban', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': pass
    },
    body: JSON.stringify({ id })
  });
  loadBans();
}
