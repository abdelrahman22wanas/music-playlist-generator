# Release Guide: Upload Setup EXE to GitHub Releases

This guide explains how to publish the Windows installer file:

- `dist/MusicPlaylistGeneratorSetup.exe`

## Before You Release

1. Build the latest installer:

```powershell
.\build_exe.ps1
```

2. Confirm files exist:

- `dist/MusicPlaylistGenerator.exe`
- `dist/MusicPlaylistGeneratorSetup.exe`

## Create a Release on GitHub

1. Open your repository on GitHub.
2. Go to **Releases**.
3. Click **Draft a new release**.
4. Create a tag (example: `v1.0.0`).
5. Set release title (example: `Music Playlist Generator v1.0.0`).
6. Add release notes (features, fixes, known issues).
7. In **Attach binaries**, upload:
   - `dist/MusicPlaylistGeneratorSetup.exe`

## Recommended Release Notes Template

```markdown
## Music Playlist Generator v1.0.0

### What is included
- Windows desktop installer: MusicPlaylistGeneratorSetup.exe
- Embedded app executable: MusicPlaylistGenerator.exe

### Highlights
- New React-based UI
- Improved playlist generation stability
- Spotify sign-in enhancements

### Installation
1. Download `MusicPlaylistGeneratorSetup.exe`
2. Run installer
3. Launch app from Start Menu
```

## Optional: Include Checksums

You can attach a checksum file for verification:

```powershell
Get-FileHash .\dist\MusicPlaylistGeneratorSetup.exe -Algorithm SHA256
```

Copy the SHA256 value into release notes.

## Final Checklist

- [ ] Version tag is correct
- [ ] `MusicPlaylistGeneratorSetup.exe` is attached
- [ ] Release notes are clear
- [ ] Setup was tested on a clean machine
- [ ] Publish release
