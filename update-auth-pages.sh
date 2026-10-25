#!/bin/bash

# Perbaikan Halaman Login dan Register
# Script ini akan menjalankan database seeder untuk menambahkan konfigurasi video

echo "🚀 Memulai update database..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Run prisma generate
echo "🔧 Generating Prisma Client..."
npx prisma generate

# Run seeder
echo "🌱 Running database seeder..."
npx prisma db seed

echo ""
echo "✅ Selesai! Konfigurasi video telah ditambahkan ke database."
echo ""
echo "📋 Konfigurasi yang ditambahkan:"
echo "   - hero_video: URL video untuk hero section"
echo "   - auth_video: URL video untuk halaman login/register"
echo "   - login_title: Judul halaman login"
echo "   - login_subtitle: Subtitle halaman login"
echo "   - register_title: Judul halaman register"
echo "   - register_subtitle: Subtitle halaman register"
echo ""
echo "🌐 Halaman yang tersedia:"
echo "   - Login: http://localhost:3000/auth/login"
echo "   - Register: http://localhost:3000/auth/register"
echo ""
echo "💡 Untuk menjalankan development server:"
echo "   npm run dev"
