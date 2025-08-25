#!/bin/bash

# Snake Game Deployment Script
# This script helps deploy the game to Vercel

echo "🐍 Snake Game Live Service - Deployment Script"
echo "=============================================="
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm i -g vercel
fi

echo "✅ Vercel CLI is installed"
echo ""

# Check for environment variables
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "📝 Please edit .env with your configuration"
    echo ""
fi

# Database setup reminder
echo "📊 Database Setup Checklist:"
echo "----------------------------"
echo "1. Create a PostgreSQL database at one of these services:"
echo "   - Supabase: https://supabase.com (Recommended)"
echo "   - Neon: https://neon.tech"
echo "   - Railway: https://railway.app"
echo ""
echo "2. Run the database setup script:"
echo "   psql YOUR_DATABASE_URL < scripts/setup-database.sql"
echo ""
echo "3. Copy your database connection string"
echo ""

# Deployment options
echo "🚀 Deployment Options:"
echo "----------------------"
echo "1. Deploy to Vercel (Production)"
echo "2. Deploy to Vercel (Preview)"
echo "3. Link to existing Vercel project"
echo "4. Run locally"
echo "5. Exit"
echo ""

read -p "Select an option (1-5): " option

case $option in
    1)
        echo ""
        echo "🚀 Deploying to Vercel (Production)..."
        echo ""
        echo "You'll need to provide:"
        echo "- POSTGRES_URL: Your database connection string"
        echo "- JWT_SECRET: A secure random string (32+ characters)"
        echo ""
        read -p "Do you have these ready? (y/n): " ready
        
        if [ "$ready" = "y" ]; then
            vercel --prod
        else
            echo ""
            echo "📝 To generate a JWT secret, run:"
            echo "node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\""
            echo ""
            echo "Then run: vercel --prod"
        fi
        ;;
    
    2)
        echo ""
        echo "🔄 Deploying to Vercel (Preview)..."
        vercel
        ;;
    
    3)
        echo ""
        echo "🔗 Linking to existing Vercel project..."
        vercel link
        ;;
    
    4)
        echo ""
        echo "🏠 Starting local development server..."
        npm run dev
        ;;
    
    5)
        echo "👋 Goodbye!"
        exit 0
        ;;
    
    *)
        echo "❌ Invalid option"
        exit 1
        ;;
esac

echo ""
echo "✅ Deployment script completed!"
echo ""
echo "📚 Next Steps:"
echo "- Visit your deployment URL"
echo "- Test user registration and login"
echo "- Play a game and check Battle Pass XP"
echo "- Verify leaderboard updates"
echo ""
echo "🎮 Happy gaming! 🐍"