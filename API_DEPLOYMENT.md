# Deploying the ClickClickJob.com API

This guide explains how to deploy the backend API for ClickClickJob.com.

## Architecture

The backend consists of two main components:
1. **Node.js API** - Serves job data to the frontend
2. **Python-Node.js Bridge** - Runs job scrapers

## Deployment Options

### Option 1: Deploying on a VPS (Recommended)

A Virtual Private Server (VPS) provides the most flexibility for running both the Node.js API and the Python bridge.

#### Requirements
- Ubuntu 22.04 or later
- Node.js 16+
- Python 3.10+
- MongoDB (or connection to MongoDB Atlas)
- Nginx (for reverse proxy)
- PM2 (for process management)

#### Setup Steps

1. **Provision a VPS**
   - Recommended specs: 2 CPU cores, 4GB RAM, 50GB SSD
   - Providers: Digital Ocean, Linode, AWS EC2, etc.

2. **Install dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y
   
   # Install Node.js
   curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
   sudo apt install -y nodejs
   
   # Install Python and pip
   sudo apt install -y python3 python3-pip python3-venv
   
   # Install MongoDB (if hosting locally)
   # Follow MongoDB documentation: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
   
   # Install Nginx
   sudo apt install -y nginx
   
   # Install PM2
   sudo npm install -g pm2
   ```

3. **Clone repository**
   ```bash
   git clone https://github.com/yottoy/remote-desk.work.git
   cd remote-desk.work
   ```

4. **Setup environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Install application dependencies**
   ```bash
   npm install
   cd python-bridge && pip3 install -r requirements.txt
   ```

6. **Configure MongoDB**
   - Set `MONGODB_URI` in .env to your MongoDB connection string
   - If using MongoDB Atlas, create a database and add your server's IP to the whitelist

7. **Setup PM2 for process management**
   ```bash
   # Create a PM2 ecosystem file
   cat > ecosystem.config.js << EOL
   module.exports = {
     apps: [
       {
         name: 'api',
         script: 'src/index.js',
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G',
         env: {
           NODE_ENV: 'production'
         }
       },
       {
         name: 'bridge',
         script: 'python-bridge/start-bridge.js',
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: '1G',
         env: {
           NODE_ENV: 'production'
         }
       }
     ]
   };
   EOL
   
   # Start the processes
   pm2 start ecosystem.config.js
   
   # Configure PM2 to start on system boot
   pm2 startup
   pm2 save
   ```

8. **Configure Nginx as reverse proxy**
   ```bash
   sudo nano /etc/nginx/sites-available/clickclickjob
   ```
   
   Add the following configuration:
   ```nginx
   server {
     listen 80;
     server_name api.clickclickjob.com;
   
     location / {
       proxy_pass http://localhost:3001;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/clickclickjob /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

9. **Setup SSL with Let's Encrypt**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.clickclickjob.com
   ```

10. **Setup cron jobs for regular scraping**
    ```bash
    crontab -e
    ```
    
    Add the following line to run scrapers daily at 2 AM:
    ```
    0 2 * * * cd /path/to/remote-desk.work && /usr/bin/node scripts/run-full-scraper.js >> /var/log/scraper.log 2>&1
    ```

### Option 2: Deploying with Docker

1. **Create a Dockerfile in the project root**
   ```bash
   cat > Dockerfile << EOL
   FROM node:16-slim
   
   # Install Python
   RUN apt-get update && apt-get install -y \
       python3 \
       python3-pip \
       && rm -rf /var/lib/apt/lists/*
   
   # Set working directory
   WORKDIR /app
   
   # Copy package.json and package-lock.json
   COPY package*.json ./
   
   # Install Node.js dependencies
   RUN npm ci --only=production
   
   # Copy Python requirements
   COPY python-bridge/requirements.txt ./python-bridge/
   
   # Install Python dependencies
   RUN pip3 install -r python-bridge/requirements.txt
   
   # Copy application code
   COPY . .
   
   # Expose ports for API and bridge
   EXPOSE 3001 8000
   
   # Start the application
   CMD ["npm", "start"]
   EOL
   ```

2. **Create Docker Compose file**
   ```bash
   cat > docker-compose.yml << EOL
   version: '3'
   
   services:
     api:
       build: .
       ports:
         - "3001:3001"
         - "8000:8000"
       environment:
         - MONGODB_URI=mongodb://mongo:27017/clickclickjob
         - NODE_ENV=production
       depends_on:
         - mongo
       restart: unless-stopped
   
     mongo:
       image: mongo:4.4
       volumes:
         - mongo-data:/data/db
       ports:
         - "27017:27017"
       restart: unless-stopped
   
   volumes:
     mongo-data:
   EOL
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up -d
   ```

## Monitoring & Maintenance

1. **Setup monitoring**
   - Use PM2's built-in monitoring: `pm2 monit`
   - Consider setting up Prometheus + Grafana for more detailed monitoring

2. **Logs**
   - API logs: `pm2 logs api`
   - Bridge logs: `pm2 logs bridge`
   - Scraper logs: Check `/var/log/scraper.log`

3. **Backups**
   - Setup regular MongoDB backups:
     ```bash
     # Create backup script
     cat > /usr/local/bin/backup-mongo.sh << EOL
     #!/bin/bash
     BACKUP_DIR="/var/backups/mongodb"
     mkdir -p \$BACKUP_DIR
     DATE=\$(date +%Y%m%d-%H%M%S)
     mongodump --out=\$BACKUP_DIR/\$DATE
     find \$BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
     EOL
     
     # Make script executable
     chmod +x /usr/local/bin/backup-mongo.sh
     
     # Add to crontab
     echo "0 3 * * * /usr/local/bin/backup-mongo.sh" | crontab -
     ```

## Security Considerations

1. **Firewall Setup**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

2. **Setup fail2ban**
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

3. **Keep system updated**
   ```bash
   # Add to crontab
   echo "0 4 * * * apt-get update && apt-get upgrade -y" | sudo tee -a /etc/crontab
   ```

## Troubleshooting

1. **API not responding**
   - Check if the process is running: `pm2 status`
   - Check logs: `pm2 logs api`
   - Restart if needed: `pm2 restart api`

2. **Bridge issues**
   - Check if process is running: `pm2 status bridge`
   - Check logs: `pm2 logs bridge`
   - Verify port 8000 is available: `netstat -tuln | grep 8000`

3. **MongoDB connection issues**
   - Check MongoDB status: `sudo systemctl status mongodb`
   - Verify connection string in .env file

## Resources

- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Docker Documentation](https://docs.docker.com/) 