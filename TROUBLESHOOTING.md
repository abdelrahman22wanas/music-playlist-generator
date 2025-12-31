# 🔧 Troubleshooting Guide

## Common Issues & Solutions

### Installation Issues

#### Problem: `pip install` fails
**Symptoms**: `ERROR: Could not find a version that satisfies the requirement`

**Solutions**:
1. Upgrade pip:
   ```powershell
   python -m pip install --upgrade pip
   ```

2. Check Python version (requires 3.8+):
   ```powershell
   python --version
   ```

3. Try installing requirements one by one:
   ```powershell
   pip install flask==2.3.3
   pip install spotipy==2.22.1
   pip install python-dotenv==1.0.0
   pip install requests==2.31.0
   ```

#### Problem: Virtual environment won't activate
**Symptoms**: `(venv)` doesn't appear in terminal

**Solutions**:
1. Check execution policy:
   ```powershell
   Get-ExecutionPolicy
   ```

2. If RestrictedSet to RemoteSigned:
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. Try activating from project directory:
   ```powershell
   cd "d:\Important\Music Playlist Generator"
   venv\Scripts\activate
   ```

---

### Authentication Issues

#### Problem: "Invalid Spotify credentials"
**Symptoms**: Error on app startup or when generating playlist

**Solutions**:
1. Verify credentials in `.env`:
   ```
   SPOTIFY_CLIENT_ID=your_actual_id_here
   SPOTIFY_CLIENT_SECRET=your_actual_secret_here
   ```

2. Check for extra spaces or quotes:
   ```
   ❌ SPOTIFY_CLIENT_ID = "your_id"
   ✅ SPOTIFY_CLIENT_ID=your_id
   ```

3. Re-generate credentials in Spotify Dashboard:
   - Go to https://developer.spotify.com/dashboard
   - Click your app
   - Regenerate credentials
   - Copy again

4. Verify `.env` is in the root directory:
   ```
   d:\Important\Music Playlist Generator\.env  ← Correct location
   ```

#### Problem: "Spotify connection test failed"
**Symptoms**: Health check endpoint returns error

**Solutions**:
1. Test your API credentials manually:
   ```python
   import spotipy
   from spotipy.oauth2 import SpotifyClientCredentials

   auth_manager = SpotifyClientCredentials(
       client_id='YOUR_ID',
       client_secret='YOUR_SECRET'
   )
   sp = spotipy.Spotify(auth_manager=auth_manager)
   results = sp.search(q='track:test', limit=1)
   print(results)
   ```

2. Check Spotify API status:
   - Go to https://developer.spotify.com/status
   - Verify services are operational

3. Restart the app:
   ```powershell
   Ctrl + C
   python app.py
   ```

---

### Runtime Issues

#### Problem: Port 5000 already in use
**Symptoms**: `Address already in use` error

**Solutions**:
1. Use different port in `app.py`:
   ```python
   if __name__ == '__main__':
       app.run(debug=True, port=5001)
   ```

2. Or kill the process using port 5000:
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

3. Or use a random available port:
   ```python
   import socket
   
   sock = socket.socket()
   sock.bind(('', 0))
   port = sock.getsockname()[1]
   sock.close()
   
   app.run(debug=True, port=port)
   ```

#### Problem: "ModuleNotFoundError" for dependencies
**Symptoms**: `No module named 'flask'` or similar

**Solutions**:
1. Verify virtual environment is activated:
   ```powershell
   # Should show (venv) prefix
   (venv) PS d:\Important\Music Playlist Generator>
   ```

2. Reinstall dependencies:
   ```powershell
   pip install -r requirements.txt
   ```

3. Check installed packages:
   ```powershell
   pip list
   ```

4. If stuck, recreate virtual environment:
   ```powershell
   deactivate
   Remove-Item venv -Recurse
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   ```

#### Problem: App crashes on startup
**Symptoms**: Process exits immediately or shows error

**Solutions**:
1. Check error message in terminal (scroll up)

2. Verify `.env` file exists:
   ```powershell
   Test-Path .env
   ```

3. Test imports manually:
   ```powershell
   python -c "import flask; import spotipy; import dotenv; print('OK')"
   ```

4. Check for syntax errors:
   ```powershell
   python -m py_compile app.py
   ```

---

### API & Playlist Issues

#### Problem: "No tracks found for your selection"
**Symptoms**: Error after clicking generate button

**Solutions**:
1. Verify all selections are made:
   - One mood should be highlighted
   - One activity should be highlighted
   - One time should be highlighted

2. Check browser console for errors (F12):
   - Network tab: Check API response
   - Console: Look for JavaScript errors

3. Verify API is responding:
   ```powershell
   # Test health endpoint
   Invoke-WebRequest http://localhost:5000/api/health
   ```

4. Check Spotify API rate limits:
   - Wait 30-60 seconds
   - Try again

#### Problem: "Missing required parameters" error
**Symptoms**: Error when clicking generate

**Solutions**:
1. Make all three selections:
   - Click a mood (color will highlight)
   - Click an activity (color will highlight)
   - Click a time (color will highlight)

2. Clear browser cache:
   - Open DevTools (F12)
   - Right-click refresh button
   - Click "Empty cache and hard refresh"

3. Check that button is enabled:
   - Generate button should be bright green
   - If grayed out, make another selection

#### Problem: Preview button doesn't work
**Symptoms**: No sound when clicking ▶ on tracks

**Solutions**:
1. Some tracks don't have previews available
   - This is a Spotify limitation
   - Check if button shows "N/A"

2. Check browser audio permissions:
   - Allow audio in browser settings
   - Check volume is not muted

3. Test audio with:
   ```javascript
   // In browser console
   const audio = new Audio('https://p.scdn.co/mp3-preview/...');
   audio.play();
   ```

4. Check network tab for audio URL:
   - Open DevTools (F12)
   - Click track
   - Check if preview URL loads

---

### Frontend Issues

#### Problem: Page won't load or layout is broken
**Symptoms**: Buttons not visible or page looks wrong

**Solutions**:
1. Clear browser cache:
   ```
   Ctrl + Shift + Delete
   ```

2. Hard refresh:
   ```
   Ctrl + F5
   ```

3. Check browser console for errors (F12)

4. Verify CSS file loads:
   - Right-click page
   - View Page Source
   - Look for `<link rel="stylesheet" href="...css/style.css">`
   - Click it to verify file loads

5. Try different browser (Chrome, Firefox, Edge)

#### Problem: Buttons not responding
**Symptoms**: Clicking buttons does nothing

**Solutions**:
1. Check browser console (F12) for JavaScript errors

2. Verify JavaScript file loads:
   - Right-click page → View Page Source
   - Look for `<script src="...js/script.js"></script>`
   - Click it to verify file loads

3. Check that selections work:
   - Click mood button
   - Should highlight in green

4. Test with simple click:
   ```javascript
   // Open console (F12), run:
   document.querySelector('.mood-btn').click()
   ```

#### Problem: Playlist results don't display
**Symptoms**: Button shows playlist loaded but results hidden

**Solutions**:
1. Open DevTools (F12) → Network tab

2. Check API response:
   - Look for `/api/generate-playlist` request
   - Check Response tab for data

3. Scroll down to see playlist:
   - Page might auto-scroll to top
   - Manually scroll down

4. Check if error message appears:
   - Look for red error box
   - Read the error text

---

### Mobile Issues

#### Problem: Buttons overlap on mobile
**Symptoms**: Buttons too small or overlapping text

**Solutions**:
1. Verify viewport meta tag in HTML:
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0">
   ```

2. Test responsive design:
   - Open DevTools (F12)
   - Click device toggle (top-left)
   - Select mobile device

3. Adjust CSS breakpoints if needed:
   ```css
   @media (max-width: 600px) {
       .button-group {
           flex-direction: column;
       }
   }
   ```

#### Problem: Touch interactions don't work on mobile
**Symptoms**: Buttons don't respond to touch

**Solutions**:
1. Add touch event listeners:
   ```javascript
   button.addEventListener('touchstart', handleMoodSelection);
   ```

2. Remove hover delays:
   ```css
   @media (hover: none) {
       button:hover {
           /* No hover effects on touch devices */
       }
   }
   ```

---

### Performance Issues

#### Problem: App is slow
**Symptoms**: Playlist takes >5 seconds to generate

**Solutions**:
1. Check Spotify API status:
   - https://developer.spotify.com/status

2. Clear Python cache:
   ```powershell
   Remove-Item __pycache__ -Recurse
   ```

3. Restart the app:
   ```powershell
   Ctrl + C
   python app.py
   ```

4. Check network connectivity:
   ```powershell
   Test-Connection 8.8.8.8
   ```

#### Problem: Server crashes after several requests
**Symptoms**: App stops responding after generating few playlists

**Solutions**:
1. Check for memory leaks:
   - Spotify client connection might not be closing
   - Review `spotify_auth.py` cleanup

2. Add error handling:
   ```python
   try:
       playlist = playlist_generator.generate_playlist(...)
   except Exception as e:
       logger.error(f"Error: {e}")
   ```

3. Restart app regularly in production:
   - Use process manager (PM2, supervisor)
   - Auto-restart on crash

---

### Windows-Specific Issues

#### Problem: PowerShell execution policy error
**Symptoms**: `cannot be loaded because running scripts is disabled`

**Solutions**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

#### Problem: File path issues on Windows
**Symptoms**: Module not found or file not found errors

**Solutions**:
1. Use forward slashes in paths:
   ```python
   ✅ path/to/file
   ❌ path\to\file
   ```

2. Or use raw strings:
   ```python
   ✅ r"path\to\file"
   ```

3. Use `pathlib`:
   ```python
   from pathlib import Path
   filepath = Path(__file__).parent / '.env'
   ```

#### Problem: `.env` file not found
**Symptoms**: `SPOTIFY_CLIENT_ID is None`

**Solutions**:
1. Verify file exists:
   ```powershell
   Get-ChildItem .env
   ```

2. Check file encoding (should be UTF-8):
   - Open in VS Code
   - Check bottom-right corner
   - Should show "UTF-8"

3. Don't use .env.txt:
   ```
   ✅ .env
   ❌ .env.txt
   ```

---

## Getting Help

### Where to Find Answers

1. **Check logs**:
   - Terminal output (scroll up)
   - Browser console (F12)

2. **Search for error**:
   - Copy exact error message
   - Search on Stack Overflow
   - Search on GitHub

3. **Spotify API Docs**:
   - https://developer.spotify.com/documentation/web-api/

4. **Spotipy Docs**:
   - https://spotipy.readthedocs.io/

### Debug Mode

Enable verbose logging:

```python
import logging

# Add to app.py
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Use in code:
logger = logging.getLogger(__name__)
logger.debug(f"Playlist params: {params}")
```

### Still Stuck?

1. Try completely fresh start:
   ```powershell
   # Backup .env file first!
   Remove-Item venv -Recurse
   python -m venv venv
   venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

2. Check all prerequisites:
   - Python 3.8+ installed
   - Spotify credentials valid
   - Internet connection working
   - Port 5000 available

3. Review error carefully:
   - Read the full error message
   - Note the file and line number
   - Check surrounding code

---

**Still need help? Check DEVELOPMENT.md or README.md for more context!**
