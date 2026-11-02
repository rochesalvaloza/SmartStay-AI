#!/usr/bin/env bash
set -euo pipefail

# Most PaaS providers inject $PORT. Apache defaults to 80.
PORT="${PORT:-80}"
sed -ri "s/^Listen 80$/Listen ${PORT}/" /etc/apache2/ports.conf
sed -ri "s/:80>/:${PORT}>/" /etc/apache2/sites-available/000-default.conf

cd /var/www/html

# Fail loudly if the platform forgot a variable rather than serving 500s.
: "${APP_KEY:?APP_KEY is not set}"
: "${DB_HOST:?DB_HOST is not set}"
: "${DB_DATABASE:?DB_DATABASE is not set}"
: "${DB_USERNAME:?DB_USERNAME is not set}"

php artisan config:clear
php artisan config:cache
php artisan storage:link || true

# Idempotent schema deployment.
php artisan migrate --force

exec apache2-foreground
