"""Windows desktop launcher for the Flask app in an embedded window."""
import os
import sys
import threading
import time
import socket
import webbrowser
from waitress import serve
try:
    import webview
except Exception:
    webview = None
from app import app


def _wait_for_server(host, port, timeout=15):
    """Wait until the local HTTP server is accepting connections."""
    deadline = time.time() + timeout
    while time.time() < deadline:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        try:
            if sock.connect_ex((host, port)) == 0:
                return True
        finally:
            sock.close()
        time.sleep(0.2)
    return False


def _run_server(host, port):
    """Run waitress server."""
    serve(app, host=host, port=port)


def _open_browser_then_serve(url, host, port):
    """Fallback mode when embedded webview backend is unavailable."""
    timer = threading.Timer(0.8, lambda: webbrowser.open(url))
    timer.daemon = True
    timer.start()
    serve(app, host=host, port=port)


def main():
    if getattr(sys, 'frozen', False):
        os.chdir(os.path.dirname(sys.executable))

    host = os.getenv('APP_HOST', '127.0.0.1')
    port = int(os.getenv('PORT', '5000'))
    url = f'http://{host}:{port}'

    server_thread = threading.Thread(target=_run_server, args=(host, port), daemon=True)
    server_thread.start()

    if not _wait_for_server(host, port):
        raise RuntimeError('Local server failed to start')

    if webview is None:
        print(f'pywebview is not available. Falling back to default browser at {url}.')
        _open_browser_then_serve(url, host, port)
        return

    try:
        webview.create_window(
            title='Music Playlist Generator',
            url=url,
            width=1200,
            height=800,
            min_size=(900, 650),
        )
        webview.start(gui='edgechromium')
    except Exception as exc:
        print(f'Embedded webview unavailable ({exc}). Falling back to default browser at {url}.')
        _open_browser_then_serve(url, host, port)


if __name__ == '__main__':
    main()
