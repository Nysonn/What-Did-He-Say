//CLIENT-SIDE VALIDATION
document.addEventListener('DOMContentLoaded', () => {
  const usernameInput = document.getElementById('username');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');

  // Username validation
  usernameInput.addEventListener('input', async () => {
    const username = usernameInput.value;
    const usernameError = document.querySelector('#username-error');

    // Check uniqueness from the server
    const response = await fetch(`/check-username?username=${username}`);
    const isUnique = await response.json();

    if (username.length === 0) {
      // Handle empty username input
      usernameInput.classList.remove('valid');
      usernameInput.classList.add('invalid');
      usernameError.textContent = "Username cannot be empty.";
    } else if (!isUnique) {
      // Username is taken
      usernameInput.classList.add('invalid');
      usernameError.textContent = "Username is already taken.";
    } else {
      // Username is unique
      usernameInput.classList.remove('invalid');
      usernameError.textContent = '';
      usernameInput.classList.add('valid');
    }
  });

  // Email validation
  emailInput.addEventListener('input', () => {
    const email = emailInput.value;
    const emailError = document.querySelector('#email-error');

    // Check if the email ends with a valid domain
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|org|net|edu|gov)$/;
    if (!emailPattern.test(email)) {
      emailInput.classList.add('invalid');
      emailError.textContent = "Please enter a valid email (e.g., example@gmail.com).";
    } else {
      emailInput.classList.remove('invalid');
      emailError.textContent = '';
      emailInput.classList.add('valid');
    }
  });

  // Password strength validation
  passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const passwordError = document.querySelector('#password-error');

    if (password.length < 8) {
      passwordError.textContent = "Password is too weak.";
      passwordInput.classList.add('invalid');
    } else if (/[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
      passwordError.textContent = " ";
      passwordInput.classList.remove('invalid');
      passwordInput.classList.add('valid');
    } else {
      passwordError.textContent = "Password should include uppercase letters, numbers, and special characters.";
      passwordInput.classList.add('invalid');
    }
  });
});
