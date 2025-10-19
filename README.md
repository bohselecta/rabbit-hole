# 🐰 Rabbit Hole Generator

An interactive investigation network that helps you explore theories, make connections, and discover hidden patterns using AI.

## Quick Start

1. **Get your DeepSeek API key:**
   - Visit https://platform.deepseek.com/
   - Sign up or log in
   - Go to API Keys section
   - Create a new key

2. **Add your API key to `.env.local`:**
   ```bash
   VITE_DEEPSEEK_API_KEY=your_actual_api_key_here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open http://localhost:5173 in your browser**

## Features

- 🌳 Interactive mind map visualization
- 🔀 Branch from any node to explore different angles
- 🕳️ "Burrows" - AI-powered connection discovery
- 🌐 Web search integration
- 💾 Import/Export investigations
- 📤 Share as text or JSON

## Development vs Production

### Development Mode
- Uses direct API calls to DeepSeek
- Requires `VITE_DEEPSEEK_API_KEY` in `.env.local`
- API key is visible in browser (development only)

### Production Mode
- Uses serverless function at `/api/chat`
- API key is kept secure on the server
- Requires `DEEPSEEK_API_KEY` environment variable in Vercel

## Deployment to Vercel

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add environment variable in Vercel Dashboard:**
   - Go to your project settings
   - Add environment variable: `DEEPSEEK_API_KEY`
   - Set value to your DeepSeek API key

5. **Deploy to production:**
   ```bash
   vercel --prod
   ```

## Project Structure

```
rabbit-hole-generator/
├── src/
│   ├── components/
│   │   └── RabbitHoleGenerator.jsx  # Main component
│   ├── App.jsx                      # App entry point
│   └── index.css                    # Tailwind CSS
├── api/
│   └── chat.js                      # Serverless function
├── vercel.json                      # Deployment config
└── .env.local                       # Your API key (not in git)
```

## Troubleshooting

### "API key not configured"
- Check `.env.local` exists and has `VITE_DEEPSEEK_API_KEY`
- Restart dev server after adding env vars
- Make sure the key starts with `VITE_`

### Build fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Tailwind styles not working
- Verify `@tailwind` directives in `src/index.css`
- Check `tailwind.config.js` content paths
- Restart dev server

## Security Note

⚠️ **Important:** Never commit your API key to version control. The `.env.local` file is already in `.gitignore` for your protection.

For production deployment, always use serverless functions to keep your API key secure on the server side.

## Cost Considerations

- DeepSeek API: Check current pricing at platform.deepseek.com
- Vercel: Free tier available for hobby projects
- Monitor usage with environment variables or logging
- Consider implementing rate limiting for production use

## Support Resources

- **DeepSeek Docs**: https://platform.deepseek.com/docs
- **Vite Docs**: https://vitejs.dev
- **Vercel Docs**: https://vercel.com/docs
- **React Docs**: https://react.dev
- **Tailwind CSS**: https://tailwindcss.com