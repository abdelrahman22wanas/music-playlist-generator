$ErrorActionPreference = 'Stop'

if (-not (Test-Path '.\\.venv\\Scripts\\python.exe')) {
    throw 'Virtual environment not found at .venv. Create it first with: python -m venv .venv'
}

$python = '.\\.venv\\Scripts\\python.exe'

& $python -m pip install --upgrade pip
& $python -m pip install pyinstaller waitress

$pyVersion = & $python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')"
if ([version]$pyVersion -lt [version]'3.14') {
    & $python -m pip install --no-deps pywebview bottle proxy_tools typing_extensions
    & $python -m pip install pythonnet
} else {
    Write-Warning "pywebview/pythonnet are not supported on Python $pyVersion. EXE will use browser fallback mode."
}

& $python -m PyInstaller --noconfirm --clean music_playlist_generator.spec

Write-Host 'EXE build complete: dist\\MusicPlaylistGenerator.exe'
