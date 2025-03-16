import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import axios from 'axios';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Middleware
app.use(cors());
app.use(express.json());

// Database setup
let db;
const initializeDatabase = async () => {
  db = await open({
    filename: './database.sqlite',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT,
      oauth_provider TEXT,
      oauth_id TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS favorites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_id TEXT NOT NULL,
      token_symbol TEXT NOT NULL,
      token_name TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, token_id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      price REAL NOT NULL,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token_id TEXT NOT NULL,
      balance REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id),
      UNIQUE(user_id, token_id)
    );
  `);

  console.log('Database initialized');
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Access denied' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Routes
// User registration
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create user
    const result = await db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    // Create initial USD wallet with $10,000
    await db.run(
      'INSERT INTO wallets (user_id, token_id, balance) VALUES (?, ?, ?)',
      [result.lastID, 'usd', 10000]
    );
    
    // Generate token
    const token = jwt.sign({ id: result.lastID, username }, JWT_SECRET, { expiresIn: '1d' });
    
    res.status(201).json({ token, user: { id: result.lastID, username, email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// User login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    // Generate token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1d' });
    
    res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile
app.get('/api/user/profile', authenticateToken, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, email FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get user's favorite tokens
    const favorites = await db.all('SELECT * FROM favorites WHERE user_id = ?', [user.id]);
    
    res.json({ user, favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get token prices from CoinGecko
app.get('/api/tokens', async (req, res) => {
  try {
    const response = await axios.get('https://api.coingecko.com/api/v3/coins/markets', {
      params: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: 50,
        page: 1,
        sparkline: false
      }
    });
    
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching token data' });
  }
});

// Get token details and history
app.get('/api/tokens/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get token details
    const detailsResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}`);
    
    // Get price history (last 30 days)
    const historyResponse = await axios.get(`https://api.coingecko.com/api/v3/coins/${id}/market_chart`, {
      params: {
        vs_currency: 'usd',
        days: 30
      }
    });
    
    // Simple prediction algorithm (just for demonstration)
    // In a real app, you would use a more sophisticated ML model
    const prices = historyResponse.data.prices.map(p => p[1]);
    const predictedPrices = prices.map((price, i) => {
      if (i === 0) return price;
      const change = (Math.random() * 0.1) - 0.05; // Random change between -5% and 5%
      return price * (1 + change);
    });
    
    res.json({
      details: detailsResponse.data,
      history: historyResponse.data,
      prediction: predictedPrices
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching token details' });
  }
});

// Add token to favorites
app.post('/api/favorites', authenticateToken, async (req, res) => {
  try {
    const { token_id, token_symbol, token_name } = req.body;
    
    await db.run(
      'INSERT OR IGNORE INTO favorites (user_id, token_id, token_symbol, token_name) VALUES (?, ?, ?, ?)',
      [req.user.id, token_id, token_symbol, token_name]
    );
    
    res.status(201).json({ message: 'Token added to favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove token from favorites
app.delete('/api/favorites/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.run(
      'DELETE FROM favorites WHERE user_id = ? AND token_id = ?',
      [req.user.id, id]
    );
    
    res.json({ message: 'Token removed from favorites' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user wallet
app.get('/api/wallet', authenticateToken, async (req, res) => {
  try {
    const wallets = await db.all('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    
    // Get current prices for tokens in wallet
    const tokenIds = wallets.filter(w => w.token_id !== 'usd').map(w => w.token_id).join(',');
    let tokenPrices = {};
    
    if (tokenIds) {
      const priceResponse = await axios.get('https://api.coingecko.com/api/v3/simple/price', {
        params: {
          ids: tokenIds,
          vs_currencies: 'usd'
        }
      });
      tokenPrices = priceResponse.data;
    }
    
    // Calculate total value in USD
    const walletWithValues = wallets.map(wallet => {
      if (wallet.token_id === 'usd') {
        return { ...wallet, value_usd: wallet.balance };
      } else {
        const price = tokenPrices[wallet.token_id]?.usd || 0;
        return { ...wallet, value_usd: wallet.balance * price, price_usd: price };
      }
    });
    
    res.json(walletWithValues);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Execute trade
app.post('/api/trade', authenticateToken, async (req, res) => {
  try {
    const { token_id, type, amount, price } = req.body;
    
    // Start transaction
    await db.run('BEGIN TRANSACTION');
    
    if (type === 'buy') {
      // Check if user has enough USD
      const usdWallet = await db.get(
        'SELECT * FROM wallets WHERE user_id = ? AND token_id = "usd"',
        [req.user.id]
      );
      
      const costUsd = amount * price;
      
      if (!usdWallet || usdWallet.balance < costUsd) {
        await db.run('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient USD balance' });
      }
      
      // Update USD wallet
      await db.run(
        'UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND token_id = "usd"',
        [costUsd, req.user.id]
      );
      
      // Update or create token wallet
      const tokenWallet = await db.get(
        'SELECT * FROM wallets WHERE user_id = ? AND token_id = ?',
        [req.user.id, token_id]
      );
      
      if (tokenWallet) {
        await db.run(
          'UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND token_id = ?',
          [amount, req.user.id, token_id]
        );
      } else {
        await db.run(
          'INSERT INTO wallets (user_id, token_id, balance) VALUES (?, ?, ?)',
          [req.user.id, token_id, amount]
        );
      }
    } else if (type === 'sell') {
      // Check if user has enough tokens
      const tokenWallet = await db.get(
        'SELECT * FROM wallets WHERE user_id = ? AND token_id = ?',
        [req.user.id, token_id]
      );
      
      if (!tokenWallet || tokenWallet.balance < amount) {
        await db.run('ROLLBACK');
        return res.status(400).json({ message: 'Insufficient token balance' });
      }
      
      // Update token wallet
      await db.run(
        'UPDATE wallets SET balance = balance - ? WHERE user_id = ? AND token_id = ?',
        [amount, req.user.id, token_id]
      );
      
      // Update USD wallet
      const valueUsd = amount * price;
      await db.run(
        'UPDATE wallets SET balance = balance + ? WHERE user_id = ? AND token_id = "usd"',
        [valueUsd, req.user.id]
      );
    }
    
    // Record transaction
    await db.run(
      'INSERT INTO transactions (user_id, token_id, type, amount, price) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, token_id, type, amount, price]
    );
    
    // Commit transaction
    await db.run('COMMIT');
    
    res.status(201).json({ message: 'Trade executed successfully' });
  } catch (error) {
    await db.run('ROLLBACK');
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get transaction history
app.get('/api/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await db.all(
      'SELECT * FROM transactions WHERE user_id = ? ORDER BY timestamp DESC',
      [req.user.id]
    );
    
    res.json(transactions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });
