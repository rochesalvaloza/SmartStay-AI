<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'app:create-admin';

    protected $description = 'Create a SmartStay AI administrator account';

    public function handle(): int
    {
        $name = $this->ask('Administrator name');
        $email = $this->ask('Administrator email');

        if (
            !is_string($name) ||
            trim($name) === '' ||
            !is_string($email) ||
            !filter_var($email, FILTER_VALIDATE_EMAIL)
        ) {
            $this->error('Please enter a valid name and email address.');

            return self::FAILURE;
        }

        if (User::where('email', $email)->exists()) {
            $this->error(
                'That email already exists. Use a new email address to avoid changing an existing account.'
            );

            return self::FAILURE;
        }

        $password = $this->secret('Administrator password (minimum 12 characters)');

        if (!is_string($password) || strlen($password) < 12) {
            $this->error('The password must contain at least 12 characters.');

            return self::FAILURE;
        }

        $confirmation = $this->secret('Confirm administrator password');

        if ($password !== $confirmation) {
            $this->error('The passwords do not match.');

            return self::FAILURE;
        }

        $admin = new User();
        $admin->name = trim($name);
        $admin->email = strtolower(trim($email));
        $admin->password = Hash::make($password);
        $admin->is_admin = true;
        $admin->save();

        $this->info('Administrator account created successfully.');
        $this->info('Email: ' . $admin->email);

        return self::SUCCESS;
    }
}