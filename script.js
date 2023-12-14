// script.js
document.addEventListener('DOMContentLoaded', () => {
  fetch('/api/recipes') // Update the fetch URL to use the correct route
    .then(response => response.json())
    .then(items => {
      console.log('Items from server:', items);
      const itemsList = document.getElementById('items-list');
      itemsList.innerHTML = items.map(item => `<p>${item.name}: ${item.description}</p>`).join('');
    })
    .catch(error => console.error('Error fetching data:', error));
});
