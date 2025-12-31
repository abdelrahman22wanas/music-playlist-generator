"""
Music Playlist Generator - Setup Configuration
Enables installation via pip: pip install -e .
"""

from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="music-playlist-generator",
    version="1.0.0",
    author="Abdelrahman Wanas",
    author_email="your-email@example.com",
    description="Generate personalized Spotify playlists based on mood, activity, and time of day",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/abdelrahman22wanas/music-playlist-generator",
    project_urls={
        "Bug Tracker": "https://github.com/abdelrahman22wanas/music-playlist-generator/issues",
        "Documentation": "https://github.com/abdelrahman22wanas/music-playlist-generator/blob/main/README.md",
    },
    packages=find_packages(exclude=["tests", "docs"]),
    include_package_data=True,
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: End Users/Desktop",
        "Topic :: Multimedia :: Sound/Audio",
        "License :: OSI Approved :: MIT License",
        "Operating System :: OS Independent",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
    ],
    python_requires=">=3.8",
    install_requires=[
        "flask==2.3.3",
        "spotipy==2.22.1",
        "python-dotenv==1.0.0",
        "requests==2.31.0",
        "gunicorn==21.2.0",
    ],
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.9.1",
            "flake8>=6.1.0",
            "isort>=5.12.0",
        ],
    },
    entry_points={
        "console_scripts": [
            "music-playlist-generator=app:app",
        ],
    },
)
