"""
Music Playlist Generator - Setup Configuration
Enables installation via pip: pip install -e .
"""

import os
from setuptools import setup, find_packages


def read_long_description():
    """Prefer root README and fall back to docs README for packaging."""
    candidate_paths = ["README.md", os.path.join("DOCS", "README.md")]
    for path in candidate_paths:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as fh:
                return fh.read()
    return "Music Playlist Generator"


long_description = read_long_description()

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
        "gunicorn==23.0.0",
        "waitress==3.0.2",
        "pywebview==6.1; platform_system == 'Windows' and python_version < '3.14'",
        "pythonnet==3.0.5; platform_system == 'Windows' and python_version < '3.14'",
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
            "music-playlist-generator=app:main",
        ],
    },
)
