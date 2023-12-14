// script.js
document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/items')
    .then(response => response.json())
    .then(items => {
      const itemsList = document.getElementById('items-list');
      itemsList.innerHTML = items.map(item => `<p>${item.name}: ${item.description}</p>`).join('');
    })
    .catch(error => console.error('Error fetching data:', error));
});
