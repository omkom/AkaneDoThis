# Akane Production Environment

A comprehensive production environment featuring n8n automation, a Vite-based landing page, and WordPress CMS, all orchestrated with Docker Compose and secured with Nginx.

## 📂 Project Structure

```
.
├── docker compose.yml        # Main compose file
├── README.md                 # This documentation
├── dev.sh                    # Development mode script
├── build.sh                  # Build script
├── prod.sh                   # Production mode script
├── nginx/                    # Nginx configuration
│   ├── nginx.conf            # Optimized configuration for akane.production
│   └── ssl/                  # SSL certificates directory
│       ├── akane.production.crt
│       └── akane.production.key
├── landing/                  # Landing page (Vite)
│   ├── docker compose.yml    # Landing page services
│   ├── Dockerfile            # Node.js container setup
│   └── ...                   # Your Vite project files
└── wp_start/                 # WordPress
    └── docker compose.yml    # WordPress & MySQL services
```

## 🚀 Getting Started

### Prerequisites

- Docker Engine (v20.10+)
- Docker Compose (v2.0+)
- Domain pointed to your server (for production use)

### Installation

1. Clone this repository or create the structure manually:

```bash
mkdir -p nginx/ssl landing wp_start
```

2. Add your SSL certificates to the `nginx/ssl` directory:

```bash
cp your-certificates.crt nginx/ssl/akane.production.crt
cp your-key.key nginx/ssl/akane.production.key
```

3. Add your Vite project to the `landing` directory

4. Make scripts executable:

```bash
chmod +x dev.sh build.sh prod.sh
```

## 🛠️ Usage

### Development Mode

Development mode mounts your local code into the container and enables hot-reloading:

```bash
./dev.sh
```

Access the development server at: http://localhost:4173/

### Building for Production

To build the production version of your landing page:

```bash
./build.sh
```

### Production Mode

To run the entire stack in production mode:

```bash
./prod.sh
```

## 🔐 Access Points

All services are accessible through the optimized Nginx proxy:

- Landing Page: https://akane.production/
- Development Server: http://localhost:4173/ (when running dev.sh)
- n8n Dashboard: https://akane.production/n8n/
- WordPress Site: https://akane.production/wp/
- WordPress Admin: https://akane.production/wp/wp-admin/

## ⚙️ Configuration

### n8n

The n8n service is configured with:

- Persistent data storage via Docker volume
- Webhook support
- Admin interface accessible via `/n8n/` path
- Security headers and access controls

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| N8N_HOST | n8n | Host name |
| N8N_PORT | 5678 | Internal port |
| N8N_PROTOCOL | http | Protocol for internal communication |
| WEBHOOK_URL | http://localhost:5678/ | Webhook base URL |

### Landing Page

The landing page offers three operational modes:

1. **Development**: Live code editing with hot-reload (port 4173)
2. **Build**: Compilation for production
3. **Serve**: Optimized static file serving (port 3000)

Environment variables:

| Variable | Dev | Build | Serve | Description |
|----------|-----|-------|-------|-------------|
| NODE_ENV | development | production | production | Node environment |

### WordPress

WordPress is configured with:

- MySQL database
- Persistent storage for uploads and themes
- Optimized cache settings in Nginx
- Protected admin area

Database credentials:

| Variable | Default | Description |
|----------|---------|-------------|
| WORDPRESS_DB_HOST | db | Database hostname |
| WORDPRESS_DB_USER | wordpress | Database username |
| WORDPRESS_DB_PASSWORD | wordpress | Database password |
| WORDPRESS_DB_NAME | wordpress | Database name |
| MYSQL_ROOT_PASSWORD | rootpassword | Root password |

## 🔒 Security Features

The environment includes numerous security enhancements:

- HTTPS with modern TLS 1.3 support
- HTTP/2 for improved performance
- Comprehensive security headers:
  - Content Security Policy
  - XSS Protection
  - HSTS
  - X-Frame-Options
  - Referrer Policy
- Protected admin areas
- Rate limiting
- WordPress hardening
- Hidden sensitive files
- Default server catch-all

## 🚀 Performance Optimizations

Performance optimizations include:

- HTTP/2 support
- Efficient Gzip compression
- Browser caching with optimal TTLs
- Static file optimizations
- Worker process tuning
- Connection pooling
- Buffer optimizations
- File descriptor caching

## 🔍 SEO Enhancements

SEO features include:

- Proper robots.txt configuration
- XML sitemap support
- Clean URL structure
- Fast TTFB (Time To First Byte)
- Mobile-friendly setup
- Canonical URL support
- No duplicate content issues
- X-Robots-Tag headers

## 🛟 Troubleshooting

### Common Issues

1. **Port Conflicts**:
   - If port 4173 is already in use, modify the port mapping in `landing/docker compose.yml`
   - For other port conflicts, adjust the respective service's port mapping

2. **SSL Certificate Problems**:
   - Check certificate paths in `nginx/nginx.conf`
   - Ensure certificates are valid and not expired

3. **Container Connectivity**:
   - All services are on the same Docker network
   - Use service names for internal communication

4. **Vite Development Server**:
   - If you see "Network: use --host to expose" in logs, the `--host 0.0.0.0` flag is missing
   - Ensure you're accessing the correct port (4173)

5. **WordPress Database Connection**:
   - The database initializes on first startup
   - Check logs with `docker compose logs db`

### Logs

Access service logs:

```bash
# All services
docker compose logs

# Specific service
docker compose logs nginx
docker compose logs n8n
docker compose logs wordpress
```

## 🔄 Maintenance

### Updates

Update individual components:

```bash
docker compose pull
docker compose up -d
```

### Backups

Backup volumes and configurations:

```bash
# WordPress database
docker compose exec db /usr/bin/mysqldump -u root -p wordpress > backup.sql

# n8n data
docker run --rm -v n8n_data:/source -v $(pwd):/backup alpine tar -czf /backup/n8n-backup.tar.gz -C /source .
```

## 📄 License

This project configuration is provided under the MIT License.

## 🙏 Credits

Configuration created with attention to security, performance, and SEO best practices for Akane Production environment.