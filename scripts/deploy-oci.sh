#!/usr/bin/env bash
set -euo pipefail

# OCI Free Tier — first-time deployment script
# Run on the fresh Oracle Cloud Ampere A1 VM after SSH'ing in.

DOMAIN="${1:-}"
if [ -z "$DOMAIN" ]; then
  echo "Usage: $0 your-domain.com"
  echo "Run this on the OCI VM after SSH'ing in."
  echo "Omit 'https://' — just the bare domain name."
  exit 1
fi

echo "==> Installing Docker..."
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo -y
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$(whoami)"
echo "  Docker installed. Log out and back in if 'docker' needs sudo (newgrp docker)."

echo "==> Cloning repo..."
cd /opt
sudo git clone https://github.com/YOUR_ORG/community.git
sudo chown -R "$(whoami):$(whoami)" community
cd community

echo "==> Creating .env..."
cat > .env <<EOF
DOMAIN=https://$DOMAIN
DB_PASSWORD=$(openssl rand -base64 24)
JWT_SECRET=$(openssl rand -base64 48)
ENCRYPTION_SECRET=$(openssl rand -base64 48)
MINIO_ROOT_PASSWORD=$(openssl rand -base64 24)
GIPHY_API_KEY=
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=
MAIL_FROM=noreply@$DOMAIN
EOF

echo "==> Starting services..."
docker compose -f docker-compose.prod.yml up -d --build

echo "==> Waiting for health checks..."
sleep 15
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Done ==="
echo "App is running at http://$(curl -s ifconfig.me)"
echo ""
echo "Next: set up HTTPS with certbot:"
echo "  sudo dnf install -y certbot"
echo "  sudo certbot certonly --standalone -d $DOMAIN"
echo "  # Then add an nginx HTTPS server block (see scripts/nginx-ssl.conf)"
echo ""
echo "IMPORTANT: Save .env somewhere safe (it has your passwords)."
