//AUTOMATICALLY CHANGING THE QUOTE OF THE DAY
const quotes = [
  "“Stay positive, work hard, make it happen.”",
  "“The best time to plant a tree was 20 years ago. The second best time is now.”",
  "“Your limitation—it's only your imagination.”",
  "“Push yourself, because no one else is going to do it for you.”",
  "“Great things never come from comfort zones.”"
];

let currentIndex = 0;

function showQuote(index) {
  const quoteTextElement = document.getElementById('quoteText');
  quoteTextElement.textContent = quotes[index];
  quoteTextElement.classList.add('show');

  // Fade out effect after 8 seconds (to keep it visible for 10 seconds)
  setTimeout(() => {
    quoteTextElement.classList.remove('show');
  }, 8000);
}

function nextQuote() {
  currentIndex = (currentIndex + 1) % quotes.length;
  showQuote(currentIndex);
}

// Show the first quote immediately
showQuote(currentIndex);
// Change quotes every 10 seconds
setInterval(nextQuote, 10000);

//SEARCH BAR CONTAINER
document.addEventListener('DOMContentLoaded', () => {
  const searchLink = document.getElementById('search_link');
  const searchContainer = document.getElementById('search_container');
  const closeSearchButton = document.getElementById('close_search');
  const navLinks = document.querySelector('.nav_links');

  searchLink.addEventListener('click', (event) => {
    event.preventDefault();
    searchContainer.style.display = 'block';
    navLinks.style.display = 'none'; // Hide other nav links
  });

  closeSearchButton.addEventListener('click', () => {
    searchContainer.style.display = 'none';
    navLinks.style.display = 'block'; // Show other nav links
  });
});

