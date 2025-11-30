# Network Setup Guide

## Making the App Accessible Across Your Network

### Quick Start

Once your Docker containers are running, the app is automatically accessible from any device on your network.

#### Find Your Laptop's Network IP

**Windows:**
```powershell
ipconfig | Select-String "IPv4"
```

Look for an IPv4 address like `192.168.x.x` or `10.0.x.x` (not 127.0.0.1)

### Access from Another Device

Replace `YOUR_LAPTOP_IP` with your actual IP address:

- **UI (Chat Interface):** `http://YOUR_LAPTOP_IP:8080`
- **Backend API:** `http://YOUR_LAPTOP_IP:3001`
- **Model Server:** `http://YOUR_LAPTOP_IP:5000`

### Example

If your laptop IP is `192.168.0.208`:

Open your browser on another device and go to:
```
http://192.168.0.208:8080
```

### What Happens Behind the Scenes

1. The UI automatically detects the network hostname
2. When you access from `192.168.0.208:8080`, the UI connects to the backend at `192.168.0.208:3001`
3. The backend communicates with the model server at `deepseek:5000` (internal Docker network)

### Troubleshooting

#### "Connection refused" or "Cannot reach server"

**Possible causes:**
- Docker containers aren't running
- Firewall is blocking the ports
- Using 127.0.0.1 instead of your network IP

**Solutions:**

1. **Verify containers are running:**
   ```powershell
   docker ps
   ```
   You should see 3 containers: `deepseek`, backend, and ui

2. **Check Windows Firewall:**
   - Open Windows Defender Firewall → Advanced Settings
   - Ensure ports 8080, 3001, 5000 allow inbound connections
   - Or: Allow Docker Desktop through the firewall

3. **Verify network connectivity:**
   ```powershell
   ping YOUR_LAPTOP_IP
   ```

4. **Check if ports are listening:**
   ```powershell
   netstat -ano | Select-String "8080","3001","5000"
   ```

#### Browser shows "Cannot reach backend"

The UI is trying to connect to the backend at the wrong address:
- Make sure you're using your actual network IP (e.g., `192.168.0.208`)
- Not localhost or 127.0.0.1 from another device

### Network Architecture

```
Other Device (192.168.0.x)
         ↓
    Wi-Fi/Ethernet
         ↓
Your Laptop (192.168.0.208)
         ↓
   Docker Containers
    ├── UI (8080)
    ├── Backend (3001)
    └── Model Server (5000)
```

### Security Considerations

- The app is accessible to anyone on your network
- For production use, consider adding authentication
- If you want to restrict access, configure your firewall

### Accessing from the Same Laptop

Use `http://localhost:8080` or `http://192.168.0.208:8080` (both work)

