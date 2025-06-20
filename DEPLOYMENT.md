# Deploying Bibliostador to Vercel

## 🚀 Quick Deployment Steps

### 1. Install Vercel CLI
```bash
npm i -g vercel
```

### 2. Set up Vercel KV Database
```bash
# Login to Vercel
vercel login

# Link your project
vercel link

# Create KV database
vercel kv create bibliostador-db
```

### 3. Configure Environment Variables
In your Vercel dashboard, add these environment variables:
- `KV_REST_API_URL` - from your KV database
- `KV_REST_API_TOKEN` - from your KV database

### 4. Deploy
```bash
# Deploy to production
vercel --prod
```

## 🔄 Architecture Changes

### Before (WebSocket + In-Memory)
- Persistent WebSocket connections
- In-memory game state (Maps, timers)
- Single server instance

### After (Serverless + Database)
- HTTP API with polling/SSE for real-time updates
- Vercel KV (Redis) for persistent state
- Serverless functions (auto-scaling)

## 📁 File Structure for Vercel

```
/api/
  game.js          # Main game API endpoint
/src/
  lib/
    vercel-socket.ts # HTTP-based socket service
vercel.json        # Vercel configuration
```

## 🔧 Key Implementation Details

### Real-time Updates
- **Polling**: Client polls every 1 second for game state
- **Server-Sent Events**: More efficient alternative (optional)
- **WebSockets**: Not supported in Vercel serverless

### State Management
- **Vercel KV**: Redis-compatible key-value store
- **Keys used**:
  - `room:{roomId}` - Complete game state
  - `player:{playerId}` - Player-to-room mapping

### Game Timers
- **Client-side timers**: UI countdown timers
- **Server validation**: Timestamp-based validation
- **No server timers**: Serverless functions don't persist

## 🎮 Usage Changes

### Frontend Code Update
Replace the socket import:
```typescript
// Before
import { socketService } from '$lib/socket';

// After  
import { socketService } from '$lib/vercel-socket';
```

### API Endpoints
- `POST /api/game?action=createRoom`
- `POST /api/game?action=joinRoom`
- `POST /api/game?action=playerReady`
- `POST /api/game?action=selectTerritory`
- `POST /api/game?action=submitAnswer`
- `GET /api/game?action=gameState&roomId={id}`

## ⚡ Performance Considerations

### Pros
- **Auto-scaling**: Handles any number of concurrent games
- **Global CDN**: Fast loading worldwide
- **Zero maintenance**: No server management
- **Cost-effective**: Pay per request

### Cons
- **1-second delay**: Polling introduces slight latency
- **Function limits**: 10-second execution time
- **Database costs**: KV storage costs scale with usage

## 🔄 Alternative: Hybrid Deployment

If you need real WebSockets, consider:

1. **Frontend on Vercel** (SvelteKit static site)
2. **WebSocket server on Railway/Render**:
   ```bash
   # Deploy WebSocket server elsewhere
   git subtree push --prefix=server origin server-branch
   ```

## 🧪 Testing Locally

```bash
# Install Vercel CLI
npm i -g vercel

# Run locally with Vercel functions
vercel dev

# Or use the development server
npm run dev
```

## 📝 Environment Setup

Create `.env.local`:
```env
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

## 🚀 Go Live Checklist

- [ ] Vercel KV database created
- [ ] Environment variables configured
- [ ] Frontend updated to use vercel-socket.ts
- [ ] Test deployment with `vercel --prod`
- [ ] Update game URLs in your app
- [ ] Monitor performance and costs

## 💡 Tips

1. **Use SSE for better performance** than polling
2. **Implement offline handling** for network issues
3. **Add retry logic** for failed API calls
4. **Monitor KV usage** to optimize costs
5. **Consider WebSocket alternatives** like Railway for real-time features

---

Your game will be accessible at: `https://your-app.vercel.app`