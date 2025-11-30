# Network Access Setup Summary

## Your Laptop's Network Details

**Network IP:** `192.168.0.208`

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| Chat UI | `http://192.168.0.208:8080` | Chat interface - use this to access the app |
| Backend API | `http://192.168.0.208:3001` | API endpoints (used by UI internally) |
| Model Server | `http://192.168.0.208:5000` | LLM inference server (used by backend) |

## Quick Steps to Share with Others

1. **On your laptop:** Make sure Docker containers are running
   ```powershell
   docker-compose up -d
   ```

2. **On another device:** Open your browser and go to:
   ```
   http://192.168.0.208:8080
   ```

3. **Done!** The chat interface should load and work normally

## Current Docker Status

All three containers are configured to:
- ✅ Expose ports to all network interfaces (`0.0.0.0`)
- ✅ Connect via internal Docker bridge network
- ✅ Have health checks for reliability
- ✅ Auto-restart on failure

## Testing Network Access

**From your laptop (works):**
- `http://localhost:8080` → UI
- `http://127.0.0.1:8080` → UI  
- `http://192.168.0.208:8080` → UI (network IP)

**From another device on network:**
- `http://192.168.0.208:8080` → UI (network IP)

**Will NOT work from other devices:**
- `http://localhost:8080` → Not recognized
- `http://127.0.0.1:8080` → Refers to their device, not yours

## If Network Access Doesn't Work

1. **Check containers are running:**
   ```powershell
   docker ps
   ```

2. **Check ports are listening:**
   ```powershell
   netstat -ano | findstr "8080"
   ```

3. **Check Windows Firewall** (most common issue):
   - Allow Docker Desktop through Windows Defender Firewall
   - Or manually allow ports 8080, 3001, 5000

4. **Verify network connectivity:**
   ```powershell
   ping 192.168.0.208
   ```

5. **Check Docker logs:**
   ```powershell
   docker logs chatgpt-ui
   docker logs chatgpt-backend
   docker logs deepseek-model
   ```

## How the UI Detects the Network

The UI automatically uses the correct backend URL:
- Accessed from `localhost` → Connects to `localhost:3001`
- Accessed from `192.168.0.208` → Connects to `192.168.0.208:3001`
- Accessed from any other hostname → Connects to that hostname on port 3001

This is handled automatically in `ui/script.js` - no configuration needed!

