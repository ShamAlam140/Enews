// server.js - PRODUCTION READY
(async () => {
  if (typeof global.Headers === 'undefined') {
    try {
      const nodeFetchModule = await import('node-fetch');
      const NativeHeaders = nodeFetchModule.Headers;
      global.Headers = class Headers extends NativeHeaders {
        constructor(init) {
          super(init);
          return new Proxy(this, {
            set(target, prop, value) {
              if (typeof prop === 'string' && prop !== '_headers') {
                target.set(prop, value);
              }
              return Reflect.set(target, prop, value);
            },
            get(target, prop) {
              if (typeof prop === 'string' && typeof target[prop] === 'undefined') {
                return target.get(prop);
              }
              return Reflect.get(target, prop);
            }
          });
        }
      };
    } catch (e) {
      console.warn('Failed to polyfill global.Headers:', e.message);
    }
  }
  if (typeof global.Blob === 'undefined') {
    global.Blob = class Blob {
      constructor(chunks, options) {
        this.chunks = chunks || [];
        this.options = options || {};
      }
    };
  }
  if (typeof global.FormData === 'undefined') {
    global.FormData = class FormData {};
  }
  if (typeof global.ReadableStream === 'undefined') {
    global.ReadableStream = class ReadableStream {};
  }
})();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');
const { connectDatabase } = require('./config/db');

dotenv.config();

const app = express();

// Secure headers with Helmet
// Allow cross-origin resource policy so frontend can load files securely
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Disable Express fingerprinting header
app.disable('x-powered-by');

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error('CORS policy: access from this origin is not allowed'), false);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/health', (req, res) => res.json({ status: 'OK' }));

// Serve local files
const localFilesDir = path.join(__dirname, 'file');
app.use('/files', express.static(localFilesDir));

// Routes
const apiBase = `/api/v1`;
app.use(`${apiBase}/auth`, require('./routes/auth'));
app.use(`${apiBase}/files`, require('./routes/files'));
app.use(`${apiBase}/stats`, require('./routes/stats'));

// Global Error Handler (prevents stack leaks in production)
app.use((err, req, res, next) => {
  console.error('💥 Error handler caught:', err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({
    error: {
      message: process.env.NODE_ENV === 'production'
        ? 'Internal Server Error'
        : err.message || 'An unexpected error occurred'
    }
  });
});

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';

// Start server with MongoDB (reloaded for OAuth2)
connectDatabase(process.env.MONGODB_URI)
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`\n🚀 SERVER RUNNING!`);
      console.log(`📡 http://localhost:${PORT}`);
      console.log(`✅ MongoDB connected`);
      console.log(`📁 Files: ${localFilesDir}\n`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB failed:', err.message);
    process.exit(1);
  });

module.exports = app;
