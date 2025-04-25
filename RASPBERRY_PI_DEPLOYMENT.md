# Deploying ESVP Live 3 on Raspberry Pi

This guide will help you deploy the ESVP Live 3 Node.js application on a Raspberry Pi and make it accessible over the internet.

## Prerequisites

1. A Raspberry Pi (3 or newer recommended) with Raspberry Pi OS installed
2. Internet connection for the Raspberry Pi
3. SSH access to your Raspberry Pi or direct access with keyboard/monitor
4. Basic knowledge of terminal commands

## Installation Steps

### 1. Update your Raspberry Pi

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Install Node.js

Install Node.js and npm on your Raspberry Pi:

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify the installation:

```bash
node --version
npm --version
```

### 3. Clone or Transfer the Project

#### Option 1: Clone from Git (if your project is in a repository)

```bash
git clone [your-repository-url]
cd [repository-folder]
```

#### Option 2: Transfer files to Raspberry Pi

You can use SCP to transfer files from your computer to the Raspberry Pi:

From your computer:
```bash
scp -r /path/to/ESVP\ Live\ 3 pi@raspberry-pi-ip:/home/pi/esvp-live-3
```

Or use a USB drive to transfer files.

### 4. Install Dependencies

Navigate to your project directory and install dependencies:

```bash
cd /home/pi/esvp-live-3
npm install
```

## Configuration for Public Access

### 1. Configure the Application to Listen on All Interfaces

By default, the application listens on port 8080. Make sure it's configured to listen on all network interfaces (0.0.0.0) instead of just localhost.

Check the server.js file and ensure the listen command is configured correctly:

```javascript
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});
```

If you need to modify the server.js file, you can use nano:

```bash
nano server.js
```

Find the line with `app.listen` and update it as shown above. Save with Ctrl+O and exit with Ctrl+X.

### 2. Configure Port Forwarding on Your Router

To make your Raspberry Pi accessible from the internet:

1. Find your Raspberry Pi's local IP address:
   ```bash
   hostname -I
   ```

2. Log in to your router's admin panel (typically http://192.168.1.1 or http://192.168.0.1)
3. Find the port forwarding section (sometimes under "Advanced" or "NAT")
4. Add a new port forwarding rule:
   - External port: 80 (for HTTP) or any port you prefer
   - Internal port: 8080 (or whatever port your app uses)
   - Internal IP address: Your Raspberry Pi's IP address
   - Protocol: TCP

### 3. Set Up Dynamic DNS (Optional but Recommended)

Since most home internet connections have dynamic IP addresses, setting up a dynamic DNS service will give you a consistent domain name:

1. Sign up for a free dynamic DNS service like No-IP, DuckDNS, or Dynu
2. Install the dynamic DNS client on your Raspberry Pi:
   ```bash
   sudo apt install ddclient
   ```
3. Configure the client with your dynamic DNS provider details

## Running the Service as a Background Process

### Option 1: Using PM2 (Recommended)

PM2 is a process manager for Node.js applications that keeps your app running and can restart it if it crashes.

1. Install PM2:
   ```bash
   sudo npm install -g pm2
   ```

2. Start your application with PM2:
   ```bash
   cd /home/pi/esvp-live-3
   pm2 start server.js --name "esvp-live"
   ```

3. Configure PM2 to start on boot:
   ```bash
   pm2 startup
   ```
   Run the command it outputs.

4. Save the current PM2 configuration:
   ```bash
   pm2 save
   ```

5. Basic PM2 commands:
   - Check status: `pm2 status`
   - View logs: `pm2 logs esvp-live`
   - Restart app: `pm2 restart esvp-live`
   - Stop app: `pm2 stop esvp-live`

### Option 2: Using systemd

1. Create a systemd service file:
   ```bash
   sudo nano /etc/systemd/system/esvp-live.service
   ```

2. Add the following content:
   ```
   [Unit]
   Description=ESVP Live 3 Node.js Application
   After=network.target

   [Service]
   WorkingDirectory=/home/pi/esvp-live-3
   ExecStart=/usr/bin/node server.js
   Restart=always
   User=pi
   Environment=NODE_ENV=production

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start the service:
   ```bash
   sudo systemctl enable esvp-live
   sudo systemctl start esvp-live
   ```

4. Check the status:
   ```bash
   sudo systemctl status esvp-live
   ```

## Testing Your Deployment

### Testing Locally on the Raspberry Pi

1. Open a web browser on the Raspberry Pi and navigate to:
   ```
   http://localhost:8080
   ```

2. You should see the ESVP voting application.

### Testing from Another Device on Your Network

1. From another device on the same network, open a web browser and navigate to:
   ```
   http://[raspberry-pi-ip]:8080
   ```
   Replace `[raspberry-pi-ip]` with your Raspberry Pi's IP address.

### Testing Public Access

1. From a device not on your local network (like a mobile phone using cellular data), navigate to:
   ```
   http://[your-public-ip]:80
   ```
   Or if you set up dynamic DNS:
   ```
   http://[your-dynamic-dns-domain]:80
   ```

2. If you configured port forwarding to a different external port, use that port instead of 80.

## Troubleshooting

### Application Won't Start

Check the logs:
```bash
# If using PM2
pm2 logs esvp-live

# If using systemd
sudo journalctl -u esvp-live
```

### Can't Access from the Internet

1. Verify your port forwarding configuration
2. Check if your ISP blocks incoming connections
3. Try using a different external port
4. Ensure your firewall allows the connection:
   ```bash
   sudo ufw allow 8080/tcp
   ```

### Performance Issues

If your Raspberry Pi is struggling with performance:

1. Consider reducing the Node.js memory usage:
   ```bash
   NODE_OPTIONS="--max-old-space-size=512" pm2 start server.js --name "esvp-live"
   ```

2. Monitor resource usage:
   ```bash
   top
   ```

## Setting Up HTTPS

The application now supports HTTPS in addition to HTTP. Here's how to set it up:

### 1. Generate SSL Certificates

#### Option 1: Using Let's Encrypt (Recommended for Public Domains)

If you have a domain name pointing to your Raspberry Pi, you can use Let's Encrypt to get free, trusted SSL certificates:

1. Install Certbot:
   ```bash
   sudo apt install certbot
   ```

2. Generate certificates (replace yourdomain.com with your actual domain):
   ```bash
   sudo certbot certonly --standalone --preferred-challenges http -d yourdomain.com
   ```

3. Copy the certificates to your application's ssl directory:
   ```bash
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/pi/esvp-live-3/ssl/private-key.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/pi/esvp-live-3/ssl/certificate.pem
   sudo chown pi:pi /home/pi/esvp-live-3/ssl/*.pem
   ```

4. Set up auto-renewal:
   ```bash
   sudo crontab -e
   ```
   Add this line:
   ```
   0 3 * * * certbot renew --quiet && cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /home/pi/esvp-live-3/ssl/private-key.pem && cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /home/pi/esvp-live-3/ssl/certificate.pem && systemctl restart esvp-live
   ```

#### Option 2: Self-Signed Certificates (For Testing or Internal Use)

For testing or internal use, you can generate self-signed certificates:

1. Create the ssl directory if it doesn't exist:
   ```bash
   mkdir -p /home/pi/esvp-live-3/ssl
   ```

2. Generate a self-signed certificate:
   ```bash
   openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /home/pi/esvp-live-3/ssl/private-key.pem -out /home/pi/esvp-live-3/ssl/certificate.pem
   ```
   Follow the prompts to enter your information.

### 2. Configure Port Forwarding for HTTPS

In addition to the HTTP port forwarding, you'll need to set up port forwarding for HTTPS:

1. Log in to your router's admin panel
2. Add a new port forwarding rule:
   - External port: 443 (standard HTTPS port)
   - Internal port: 8443 (default HTTPS port for the application)
   - Internal IP address: Your Raspberry Pi's IP address
   - Protocol: TCP

### 3. Update Your Firewall (if enabled)

If you're using a firewall, allow the HTTPS port:

```bash
sudo ufw allow 8443/tcp
```

### 4. Testing HTTPS

1. Restart your application to apply the SSL certificate changes:
   ```bash
   # If using PM2
   pm2 restart esvp-live

   # If using systemd
   sudo systemctl restart esvp-live
   ```

2. Test locally:
   ```
   https://localhost:8443
   ```

3. Test from another device on your network:
   ```
   https://[raspberry-pi-ip]:8443
   ```

4. Test from the internet:
   ```
   https://[your-domain-or-public-ip]:443
   ```

> Note: If using self-signed certificates, browsers will show a security warning. This is normal for self-signed certificates. For production use, Let's Encrypt certificates are recommended.

## Security Considerations

For a production environment, consider:

1. Implementing authentication for admin functions
2. Configuring a firewall on your Raspberry Pi
3. Regularly updating your system and dependencies
4. Setting up HTTP to HTTPS redirection for better security

## Conclusion

Your ESVP Live 3 application should now be running on your Raspberry Pi and accessible both locally and over the internet. This setup allows you to test both the frontend and backend from any device with internet access.
