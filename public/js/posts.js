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
  const searchInput = document.getElementById('search_input');
  const searchResultsContainer = document.getElementById('search_results');

  searchLink.addEventListener('click', (event) => {
    event.preventDefault();
    searchContainer.style.display = 'block';
    navLinks.style.display = 'none'; // Hide other nav links
    searchInput.focus(); // Focus on the input when opened
  });

  closeSearchButton.addEventListener('click', () => {
    searchContainer.style.display = 'none';
    navLinks.style.display = 'block'; // Show other nav links
    searchResultsContainer.innerHTML = ''; // Clear previous results
  });

   // Listen for Enter key to submit the search
   searchInput.addEventListener('keypress', async (event) => {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if in a form
        const query = searchInput.value.trim();
        if (query) {
            // Fetch results from the backend
            const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
            if (response.ok) {
                const results = await response.json();
                displaySearchResults(results);
            }
        }
    }
});

  //REMOVE SPACES IN THE SEARCH INPUT
  searchInput.addEventListener('input', async () => {
    const query = searchInput.value.trim();

    if (query) {
        // Fetch results from the backend
        const response = await fetch(`/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const results = await response.json();
            displaySearchResults(results);
        }
    } else {
        // Clear results if input is empty
        searchResultsContainer.innerHTML = '';
    }
});

//FUNCTION TO DISPLAY SEARCH RESULTS
function displaySearchResults(results) {
  const resultsContainer = document.getElementById('search_results'); // Ensure this element exists in your HTML

  // Clear previous results
  resultsContainer.innerHTML = '';

  // Check if results are empty
  if (!results.posts.length && !results.comments.length && !results.users.length) {
      resultsContainer.innerHTML = '<p>No results found.</p>';
      return;
  }

  // Display posts
  if (results.posts.length) {
      resultsContainer.innerHTML += '<h3>Posts:</h3>';
      results.posts.forEach(post => {
          resultsContainer.innerHTML += `<div><h4>${post.text_content}</h4></div>`;
      });
  }

  // Display comments
  if (results.comments.length) {
      resultsContainer.innerHTML += '<h3>Comments:</h3>';
      results.comments.forEach(comment => {
          resultsContainer.innerHTML += `<div><p>${comment.comment_text}</p></div>`;
      });
  }

  // Display users
  if (results.users.length) {
      resultsContainer.innerHTML += '<h3>Users:</h3>';
      results.users.forEach(user => {
          resultsContainer.innerHTML += `<div><p>${user.username}</p></div>`;
      });
  }
}
});


