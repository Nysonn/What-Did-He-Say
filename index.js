import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import pg from "pg";
import bcrypt from "bcrypt";
import multer from "multer";
import session from 'express-session';
import path from 'path';

dotenv.config();

const port = 3000;
const app = express();

const db = new pg.Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DATABASE,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

// Connect to the PostgreSQL database
db.connect();

//COOKIE SESSION
app.use(session({
  secret: process.env.SESSION_SECRET, 
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 // 1 day 
  }
}));


//TESTING COOKIES
app.get('/session', (req, res) => {
  res.json(req.session);
});

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Ensure you have an 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Generate a unique filename
  }
});

const upload = multer({ storage: storage });

// Set EJS as the view engine
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(express.static("uploads"));
app.use(bodyParser.urlencoded({ extended: true }));


// Serve uploaded files from the "uploads" directory
app.use('/uploads', express.static('uploads'));

// GET ROUTE SIGN-UP ROUTE
app.get("/sign-up", (req, res) => {
  res.render("sign-up", { error: null });
});

//GET ROUTE FOR CHECKING UNIQUE NAME
app.get('/check-username', async (req, res) => {
  const username = req.query.username;
  const user = await db.query('SELECT * FROM users WHERE username = $1', [username]);

  res.json(user.rowCount === 0); // Returns true if the username is unique
});

// POST ROUTE SIGN-UP ROUTE
app.post('/signup', async (req, res) => {
  const { username, email, password } = req.body;

  // Regex to match valid email domains (e.g., gmail.com, yahoo.com)
  const validEmailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com|outlook\.com)$/;
  // Regex to check username constraints (max 2 digits, max 20 characters)
  const usernameRegex = /^(?=.*[a-zA-Z])[a-zA-Z0-9]{1,20}$/;
  const digitCount = (username.match(/\d/g) || []).length;

  try {
    // Validate username format and ensure it’s unique
    if (!usernameRegex.test(username) || digitCount > 2) {
      return res.status(400).json({
        error: 'Username must be 1-20 characters, contain max 2 digits, and no special characters.'
      });
    }

    // Check if the username already exists
    const usernameCheck = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    if (usernameCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    // Validate email format
    if (!validEmailRegex.test(email)) {
      return res.status(400).json({
        error: 'Email must end with @gmail.com, @yahoo.com, or @outlook.com'
      });
    }

    // Check if the email already exists in the database
    const emailCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Email is already registered' });
    }

    // Validate password strength
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters, include an uppercase letter and a number'
      });
    }

    // Hash the password before saving it to the database
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the new user into the database
    const result = await db.query(
      'INSERT INTO users (username, email, password) VALUES ($1, $2, $3) RETURNING id',
      [username, email, hashedPassword]
    );

    // Set session for the logged-in user
    req.session.user_id = result.rows[0].id; // Use the returned user id
    req.session.username = username; // Set username in the session

    // Redirect to posts page after successful sign-up
    res.redirect('/posts');
  } catch (error) {
    console.error('Error during sign-up:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ROUTE FOR LOGIN
app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

// POST ROUTE FOR LOGIN
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      return res.status(400).render('login', { error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).render('login', { error: 'Invalid email or password' });
    }

    // Set session for the logged-in user
    req.session.user_id = user.id;  // This line is causing the error
    req.session.username = user.username;
    req.session.account_icon = user.account_icon; // in your login route

    // Redirect to posts page
    res.redirect('/posts');
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// GET ROUTE FOR POSTS PAGE
app.get('/posts', async (req, res) => {
  try {
    // Query to fetch posts from the database
    const postsResult = await db.query(`SELECT posts.*, users.username, users.account_icon
      FROM posts
      JOIN users ON posts.user_id = users.id
      ORDER BY posts.id DESC
    `);

    const posts = postsResult.rows;

    // Fetch comments for each post
    for (let post of posts) {
      const commentsResult = await db.query(
        'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE post_id = $1 ORDER BY comments.id ASC',
        [post.id]
      );
      post.comments = commentsResult.rows;
    }

    // Render the posts page and pass user info
    res.render('posts', { posts, user: { id: req.session.user_id, username: req.session.username, account_icon: req.session.account_icon } });
  } catch (error) {
    console.error('Error retrieving posts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// POST ROUTE FOR NEW POST
app.post('/posts', upload.single('image'), async (req, res) => {
  const { post_text } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null; // Check if an image is uploaded

  try {
    // Assuming that user_id is saved in session after the user logs in
    const userId = req.session.user_id;
    
    if (!userId) {
      return res.status(403).json({ error: 'User not authenticated' });
    }

    // Insert the new post into the database
    await db.query(
      'INSERT INTO posts (user_id, text_content, image_url) VALUES ($1, $2, $3)',
      [userId, post_text, image]
    );

    // Redirect to the posts page after successful post creation
    res.redirect('/posts');
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST ROUTE FOR ADDING A COMMENT
app.post('/posts/:id/comment', async (req, res) => {
  const postId = req.params.id;
  const { comment_text } = req.body;
  const userId = req.session.user_id; // Assuming user_id is stored in session

  try {
    if (!userId) {
      return res.status(403).json({ error: 'User not authenticated' });
    }

    // Insert the comment into the comments table
    await db.query(
      'INSERT INTO comments (post_id, user_id, comment_text) VALUES ($1, $2, $3)',
      [postId, userId, comment_text]
    );

    // Redirect back to the posts page after successful comment submission
    res.redirect('/posts');
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ROUTE FOR ACCOUNT PAGE
app.get('/account', async (req, res) => {
  const userId = req.session.user_id; // Assuming user_id is stored in the session

  try {
    if (!userId) {
      return res.status(403).json({ error: 'User not authenticated' });
    }

    // Fetch user data from the database
    const userResult = await db.query('SELECT username, email, account_icon FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Fetch user's posts from the database
    const postsResult = await db.query(
      'SELECT * FROM posts WHERE user_id = $1 ORDER BY id DESC',
      [userId]
    );

    const posts = postsResult.rows;

    // Render the account page with the user's data and posts
    res.render('account-page', { user, posts });
  } catch (error) {
    console.error('Error fetching account data:', error);
    res.status(500).json({ error: 'Server error' });
  }
});


// GET ROUTE FOR EDITING PROFILE
app.get('/edit-profile', async (req, res) => {
  const userId = req.session.user_id; // Assuming user_id is stored in session

  try {
    // Fetch the current user's data from the database
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Render the edit profile page and pass user info
    res.render('edit-profile', { user }); // You need to create an edit-profile.ejs file
  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST ROUTE FOR EDITING PROFILE
app.post('/edit-profile', upload.single('account_icon'), async (req, res) => {
  const userId = req.session.user_id; // Assuming user_id is stored in session
  const { username } = req.body;
  let accountIcon = null;

  try {
    if (req.file) {
      accountIcon = `/uploads/${req.file.filename}`; // Save the uploaded image path
    }

    // Update the user's information in the database
    await db.query(
      `UPDATE users 
       SET username = $1, account_icon = COALESCE($2, account_icon) 
       WHERE id = $3`,
      [username, accountIcon, userId]
    );

    // Redirect back to the account page after successful update
    res.redirect('/account');
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET ROUTE FOR THE SEARCH PAGE
app.get('/search', (req, res) => {
  res.render('search');
});

// GET ROUTE FOR THE SEARCH RESULTS
app.get('/search/results', (req, res) => {
  const searchQuery = req.query.query;
  // Logic to process search query and retrieve results
  res.render('search-results', { query: searchQuery, results: [] }); // Example setup
});

//GET ROUTE FOR SEARCH RESULTS IN REAL-TIME TO KEEP UPDATING
app.get('/search/results', (req, res) => {
  const searchQuery = req.query.query;
  // Replace with your logic to fetch matching results based on `searchQuery`
  const results = [
      { title: "Sample Result 1" },
      { title: "Sample Result 2" },
      { title: "Sample Result 3" }
  ].filter(result => result.title.toLowerCase().includes(searchQuery.toLowerCase()));
  
  res.json({ results });
});



// START THE SERVER
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});