#!/usr/bin/env python3
"""Render a living-canvas HTML page to MP4, frame by frame.

The page must expose the frame contract:

    window.LC = { duration: 12, fps: 30, width: 1080, height: 1920,
                  render: (t) => { /* draw the frame at t seconds */ } }

Every frame is drawn by calling LC.render(t) directly, so the output is
deterministic: no dropped frames, no screen recording, identical on any machine.

Usage:
    python3 scripts/render_mp4.py canvas.html out.mp4 [--scale 2] [--crf 18]
                                                    [--loops 1] [--poster poster.png]
Needs: playwright (Chromium) and ffmpeg.
"""
import argparse, base64, pathlib, shutil, subprocess, sys

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("html"); ap.add_argument("out")
    ap.add_argument("--scale", type=float, default=2, help="supersampling factor (2 = smooth edges)")
    ap.add_argument("--crf", type=int, default=18, help="x264 quality, lower is better (17-23)")
    ap.add_argument("--loops", type=int, default=1, help="repeat the loop N times in the file")
    ap.add_argument("--poster", help="also save the frame at --poster-at as a PNG")
    ap.add_argument("--poster-at", type=float, default=None, help="seconds; default = 85%% of duration")
    a = ap.parse_args()

    if not shutil.which("ffmpeg"):
        sys.exit("ffmpeg not found. Install it (apt install ffmpeg / brew install ffmpeg).")
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        sys.exit("playwright not found. Run: pip install playwright && python3 -m playwright install chromium")

    url = pathlib.Path(a.html).resolve().as_uri()
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto(url)
        page.wait_for_function("window.LC && typeof window.LC.render === 'function'", timeout=15000)
        page.evaluate("document.fonts ? document.fonts.ready : null")
        cfg = page.evaluate("({d: LC.duration, fps: LC.fps || 30, w: LC.width, h: LC.height})")
        w, h, fps, dur = cfg["w"], cfg["h"], cfg["fps"], cfg["d"]
        if w % 2 or h % 2:
            sys.exit(f"LC.width/height must be even for H.264, got {w}x{h}")
        # switch the page into export mode: fixed-size offscreen canvas at w*scale
        page.evaluate(f"window.__lcExport({w}, {h}, {a.scale})")
        n = round(dur * fps)
        ff = subprocess.Popen(
            ["ffmpeg", "-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", str(fps), "-i", "-",
             "-vf", f"scale={w}:{h}:flags=lanczos", "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-crf", str(a.crf), "-preset", "slow", "-movflags", "+faststart", a.out],
            stdin=subprocess.PIPE)
        poster_t = a.poster_at if a.poster_at is not None else dur * 0.85
        for loop in range(a.loops):
            for i in range(n):
                t = i / fps
                data = page.evaluate(f"window.__lcFrame({t})")
                png = base64.b64decode(data.split(",", 1)[1])
                ff.stdin.write(png)
                if a.poster and loop == 0 and abs(t - poster_t) < 0.5 / fps:
                    pathlib.Path(a.poster).write_bytes(png)
                if i % fps == 0:
                    print(f"\rframe {i + loop * n}/{n * a.loops}", end="", flush=True)
        ff.stdin.close(); ff.wait(); browser.close()
    print(f"\nwrote {a.out} ({w}x{h}, {dur}s @ {fps}fps x{a.loops})")
    if ff.returncode:
        sys.exit("ffmpeg failed")

if __name__ == "__main__":
    main()
