#!/usr/bin/env python3
"""
Music Playlist Generator - Setup Script
Automated installation and configuration for the project.
"""

import os
import sys
import subprocess
import platform

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 60)
    print(f"  {text}")
    print("=" * 60 + "\n")

def print_success(text):
    """Print success message"""
    print(f"✅ {text}")

def print_info(text):
    """Print info message"""
    print(f"ℹ️  {text}")

def print_error(text):
    """Print error message"""
    print(f"❌ {text}")

def print_warning(text):
    """Print warning message"""
    print(f"⚠️  {text}")

def check_python_version():
    """Verify Python version is 3.8 or higher"""
    print_info(f"Checking Python version...")
    version = sys.version_info
    if version.major < 3 or (version.major == 3 and version.minor < 8):
        print_error(f"Python 3.8+ required. You have {version.major}.{version.minor}")
        sys.exit(1)
    print_success(f"Python {version.major}.{version.minor} detected")

def create_venv():
    """Create virtual environment"""
    print_info("Creating virtual environment...")
    try:
        subprocess.run([sys.executable, "-m", "venv", "venv"], check=True)
        print_success("Virtual environment created")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to create virtual environment: {e}")
        sys.exit(1)

def get_pip_executable():
    """Get the pip executable path for current OS"""
    if platform.system() == "Windows":
        return os.path.join("venv", "Scripts", "pip")
    else:
        return os.path.join("venv", "bin", "pip")

def install_requirements():
    """Install Python dependencies"""
    print_info("Installing dependencies from requirements.txt...")
    pip_exe = get_pip_executable()
    try:
        subprocess.run([pip_exe, "install", "-r", "requirements.txt"], check=True)
        print_success("Dependencies installed")
    except subprocess.CalledProcessError as e:
        print_error(f"Failed to install dependencies: {e}")
        sys.exit(1)

def setup_env_file():
    """Create or verify .env file"""
    print_info("Setting up environment configuration...")
    
    if os.path.exists(".env"):
        print_info(".env file already exists")
        
        # Check if it has credentials
        with open(".env", "r") as f:
            content = f.read()
            if "your_client_id_here" in content or "your_secret_here" in content:
                print_warning("Please update .env with your Spotify credentials:")
                print_info("  1. Visit: https://developer.spotify.com/dashboard")
                print_info("  2. Create/Login to your Spotify Developer Account")
                print_info("  3. Create an Application")
                print_info("  4. Copy Client ID and Client Secret")
                print_info("  5. Update .env file with your credentials")
        return
    
    # Create .env template
    print_info("Creating .env template...")
    env_content = """# Spotify API Credentials
# Get these from https://developer.spotify.com/dashboard
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here

# Flask Configuration
FLASK_ENV=development
FLASK_DEBUG=True
SECRET_KEY=your_secret_key_here
"""
    
    try:
        with open(".env", "w") as f:
            f.write(env_content)
        print_success(".env template created")
        print_warning("⚠️  IMPORTANT: Update .env with your Spotify credentials!")
        print_info("  1. Visit: https://developer.spotify.com/dashboard")
        print_info("  2. Create an Application")
        print_info("  3. Copy your Client ID and Client Secret")
        print_info("  4. Open .env and replace the placeholder values")
    except IOError as e:
        print_error(f"Failed to create .env: {e}")
        sys.exit(1)

def get_activation_command():
    """Get the virtual environment activation command for current OS"""
    if platform.system() == "Windows":
        return "venv\\Scripts\\activate"
    else:
        return "source venv/bin/activate"

def print_next_steps():
    """Print instructions for next steps"""
    print_header("✅ Setup Complete!")
    
    print_info("Next steps:")
    print_info("")
    print_info("1️⃣  Update your .env file with Spotify credentials:")
    print_info("   - Visit: https://developer.spotify.com/dashboard")
    print_info("   - Create an Application")
    print_info("   - Copy your credentials to .env")
    print_info("")
    print_info("2️⃣  Activate the virtual environment:")
    activation_cmd = get_activation_command()
    print(f"   {activation_cmd}")
    print_info("")
    print_info("3️⃣  Run the application:")
    print_info("   python app.py")
    print_info("")
    print_info("4️⃣  Open your browser:")
    print_info("   http://localhost:5000")
    print_info("")
    print_header("🎵 Happy Playlist Generating!")

def main():
    """Main setup function"""
    print_header("🎵 Music Playlist Generator Setup")
    
    # Check Python version
    check_python_version()
    
    # Create virtual environment
    create_venv()
    
    # Install dependencies
    install_requirements()
    
    # Setup .env file
    setup_env_file()
    
    # Print next steps
    print_next_steps()

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print_warning("\nSetup cancelled by user")
        sys.exit(0)
    except Exception as e:
        print_error(f"Unexpected error: {e}")
        sys.exit(1)
