# Deployment Guide to Oracle Cloud Free Tier

This guide will walk you through setting up your Oracle Cloud instance and deploying the **DhanSarthi** application using Docker.

## Prerequisite: Project Setup
Ensure your code is pushed to a GitHub repository so you can easily pull it onto your server.

## Step 1: Create Compute Instance
1.  Log in to your **Oracle Cloud Console**.
2.  Go to **Menu** -> **Compute** -> **Instances**.
3.  Click **Create Instance**.
4.  **Name**: `dhansarthi-server` (or whatever you like).
5.  **Image & Shape**: 
    - Default **Oracle Linux 8** or **Ubuntu 22.04** are good choices.
    - **Shape**: "Ampere" (VM.Standard.A1.Flex) is usually the best free tier option (4 OCPUs, 24GB RAM). If not available, use the AMD Micro instance.
6.  **Networking**:
    - Ensure "Assign a public IPv4 address" is checked.
7.  **SSH Keys**:
    - **Save Private Key**: Download this file (`.key`)! You will need it to login.
8.  Click **Create**.

## Step 2: Open Ports (Firewall)
By default, only port 22 (SSH) is open. We need port **80** for the web app.

1.  Click on your new **Instance Name**.
2.  Click on the **Subnet** link (usually named `subnet-...`).
3.  Click on the **Default Security List**.
4.  Click **Add Ingress Rules**:
    - **Source CIDR**: `0.0.0.0/0` (Allows access from anywhere)
    - **Destination Port Range**: `80`
    - **Description**: Allow HTTP
5.  Click **Add Ingress Rules**.

*Note: You might also need to open port 80 on the server's internal firewall (iptables) later.*

## Step 3: Connect to Server
Open your terminal on your local Mac:
```bash
# Move the key to a safe folder (optional)
mv ~/Downloads/ssh-key-*.key ~/.ssh/oracle_key

# Set permissions (Critical!)
chmod 400 ~/.ssh/oracle_key

# Connect (replace x.x.x.x with your Instance Public IP)
# If using Oracle Linux: user is 'opc'
# If using Ubuntu: user is 'ubuntu'
ssh -i ~/.ssh/oracle_key opc@x.x.x.x
```

## Step 4: Install Docker
Run these commands inside your server terminal:

```bash
# Update packages
sudo dnf update -y     # For Oracle Linux
# sudo apt update -y   # For Ubuntu

# Install Docker
sudo dnf config-manager --add-repo=https://download.docker.com/linux/centos/docker-ce.repo
sudo dnf install -y docker-ce docker-ce-cli containerd.io
sudo systemctl start docker
sudo systemctl enable docker

# Install Docker Compose (if not included)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Fix Permissions (so you don't need 'sudo' for docker comands)
sudo usermod -aG docker $USER
newgrp docker
```

## Step 5: Deploy Application

1.  **Clone Project**:
    ```bash
    git clone https://github.com/your-username/DhanSarthi.git
    cd DhanSarthi
    ```
    *(If your repo is private, you may need to set up an SSH key or use a Personal Access Token).*

2.  **Setup Environment**:
    Create the `.env` file for the backend:
    ```bash
    cd backend
    nano .env
    ```
    Paste your production variables (DB credentials matching docker-compose.yml):
    ```env
    PORT=3000
    DB_HOST=mysql
    DB_USER=root
    DB_PASSWORD=mysecretpassword
    DB_NAME=gamyartha
    REDIS_URL=redis://redis:6379
    JWT_SECRET=your_production_secret
    NODE_ENV=production
    ```
    Press `Ctrl+X`, then `Y`, then `Enter` to save.

3.  **Start the App**:
    Go back to the root folder and run:
    ```bash
    cd ..
    docker-compose up -d --build
    ```

## Step 6: Final Firewall Fix (Oracle Linux Only)
Oracle Linux has a strict internal firewall. Allow traffic one last time:
```bash
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

## Done!
Visit `http://<YOUR_INSTANCE_IP>` in your browser.
