# Laravel 12 API — production image
# Designed to run on Railway / Render / Fly.io / any Docker host.
FROM php:8.2-apache

ENV APACHE_DOCUMENT_ROOT=/var/www/html/public \
    COMPOSER_ALLOW_SUPERUSER=1

# PHP extensions Laravel needs. pdo_mysql is mandatory: the rooms query in
# RoomController uses MySQL's TIMESTAMP(a, b) function.
RUN apt-get update && apt-get install -y --no-install-recommends \
        git unzip libzip-dev libonig-dev \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql mbstring bcmath zip opcache \
    && a2enmod rewrite \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Point Apache at public/ so .env and storage/ are not web-reachable.
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

WORKDIR /var/www/html

# Dependencies first, so code changes do not bust the dependency layer.
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction --no-progress

COPY . .

RUN composer dump-autoload --optimize --no-dev --no-interaction \
    && mkdir -p bootstrap/cache storage/app/public storage/framework/cache/data \
                storage/framework/sessions storage/framework/views storage/logs \
    && chown -R www-data:www-data storage bootstrap/cache

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
