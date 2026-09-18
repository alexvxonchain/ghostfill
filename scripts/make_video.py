"""GHOSTFILL terminal clip: nest skips, then a clean paper print."""
from __future__ import annotations

import json
import math
import subprocess
import wave
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
FRAMES = ROOT / "frames"
ASSETS = ROOT / "assets"
TAPE = FRAMES / "tape.json"
OUT = ASSETS / "ghostfill.mp4"
STILL = ASSETS / "desk.png"
WAV = ASSETS / "bed.wav"

W, H, FPS, SECS = 1280, 720, 30, 40
BG = (6, 10, 8)
PANEL = (12, 20, 16)
LINE = (32, 58, 44)
GREEN = (93, 255, 154)
MINT = (212, 255, 232)
AMBER = (231, 193, 90)
RED = (255, 107, 90)
MUTE = (109, 138, 122)
DIM = (8, 14, 11)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "consolab.ttf" if bold else "consola.ttf"
    try:
        return ImageFont.truetype(str(Path(r"C:\Windows\Fonts") / name), size)
    except OSError:
        return ImageFont.load_default()


F_BRAND = font(28, True)
F_META = font(16)
F_LOG = font(18)
F_BIG = font(56, True)
F_PNL = font(52, True)
F_SM = font(14)
F_BOOT = font(72, True)


def kind_color(kind: str) -> tuple[int, int, int]:
    k = kind.lower()
    if k in {"print", "paper", "close"}:
        return GREEN
    if k == "nest":
        return AMBER
    if k == "void":
        return RED
    return MINT


def scanlines(img: Image.Image) -> Image.Image:
    overlay = Image.new("RGB", (W, H), (0, 0, 0))
    d = ImageDraw.Draw(overlay)
    for y in range(0, H, 3):
        d.line((0, y, W, y), fill=(0, 0, 0))
    return Image.blend(img, overlay, 0.12)


def vignette(img: Image.Image) -> Image.Image:
    mask = Image.new("L", (W, H), 0)
    md = ImageDraw.Draw(mask)
    md.ellipse((-80, -90, W + 80, H + 90), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(42))
    dark = Image.new("RGB", (W, H), (0, 0, 0))
    return Image.composite(img, Image.blend(img, dark, 0.42), mask)


def draw_frame(s: dict) -> Image.Image:
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    t = float(s["t"])

    d.rectangle((18, 16, W - 18, H - 16), outline=LINE, width=1)
    d.text((36, 30), "GHOSTFILL", font=F_BRAND, fill=GREEN)
    d.text((250, 40), "paper desk  ·  send false", font=F_SM, fill=MUTE)
    d.text((1244, 40), s["clock"], font=F_META, fill=MUTE, anchor="rt")
    d.line((36, 72, W - 36, 72), fill=LINE)

    logs = s.get("logs") or []
    visible = logs[-12:]
    y = 96
    for log in visible:
        col = kind_color(log["kind"])
        sec = f"00:{int(log['t']):02d}"
        d.text((44, y), sec, font=F_LOG, fill=MUTE)
        d.text((130, y), log["line"], font=F_LOG, fill=col)
        y += 28

    if visible and int(t * 2) % 2 == 0:
        d.rectangle((130, y - 2, 142, y + 16), fill=GREEN)

    d.rectangle((820, 92, 1244, 560), outline=LINE)
    mint = s["mint"]
    d.text((842, 110), "LOOKING AT", font=F_SM, fill=MUTE)
    d.text((842, 138), mint["ticker"], font=F_BIG, fill=MINT)
    ev = s["event"]
    d.text((842, 210), ev, font=F_META, fill=kind_color(ev))

    stats = [
        (842, 250, "FILL", f"{mint['fill']:.1f}%"),
        (1040, 250, "UNIQUE", str(mint["unique"])),
        (842, 318, "NEST", f"{mint['nest']:.2f}"),
        (1040, 318, "MCAP", f"${mint['mcap']:.1f}k"),
    ]
    for x, yy, label, val in stats:
        d.text((x, yy), label, font=F_SM, fill=MUTE)
        d.text((x, yy + 22), val, font=F_META, fill=MINT)

    paper = s["paper"]
    if paper["active"]:
        pnl = f"{paper['sol']:+.2f} SOL"
        d.text((842, 410), pnl, font=F_PNL, fill=GREEN)
        tag = "paper closed" if paper["closed"] else "paper print"
        d.text((842, 478), tag, font=F_META, fill=GREEN)
    else:
        d.text((842, 410), "wait", font=F_PNL, fill=MUTE)

    sess = s["session"]
    d.text(
        (36, 620),
        f"{sess['prints']} print   {sess['voids']} void   {sess['nests']} nest   no keys",
        font=F_SM,
        fill=MUTE,
    )
    d.text((36, 656), "NO KEYS  ·  NOTHING SENDS  ·  OPEN ON PUMP.FUN", font=F_SM, fill=MUTE)
    d.text((1244, 656), "github.com/alexvxonchain/ghostfill", font=F_SM, fill=MUTE, anchor="rt")

    img = vignette(scanlines(img))

    if 15.6 <= t < 17.1:
        flash = Image.new("RGB", (W, H), GREEN)
        img = Image.blend(img, flash, 0.10 * (math.sin((t - 15.6) * 8) ** 2))
    if 31.8 <= t < 33.0:
        flash = Image.new("RGB", (W, H), GREEN)
        img = Image.blend(img, flash, 0.06)
    return img


def write_bed(tape: list[dict]) -> None:
    sr = 44100
    n = int(sr * SECS)
    mix = np.zeros(n, dtype=np.float64)
    rng = np.random.default_rng(4)
    t = np.arange(n) / sr

    hum = 0.045 * np.sin(2 * np.pi * 52 * t)
    hum += 0.02 * np.sin(2 * np.pi * 104 * t)
    mix += hum

    def place(sig: np.ndarray, at_s: float, gain: float = 1.0) -> None:
        i = int(at_s * sr)
        if i < 0 or i >= n:
            return
        sl = min(len(sig), n - i)
        mix[i : i + sl] += sig[:sl] * gain

    def click() -> np.ndarray:
        tt = np.arange(int(0.04 * sr)) / sr
        env = np.exp(-tt * 90)
        return env * rng.standard_normal(len(tt))

    def lock_tone() -> np.ndarray:
        tt = np.arange(int(1.6 * sr)) / sr
        env = np.exp(-tt * 1.8) * (1 - np.exp(-tt * 18))
        sig = np.sin(2 * np.pi * 196 * tt) + 0.4 * np.sin(2 * np.pi * 392 * tt)
        return env * sig

    seen = set()
    for row in tape:
        key = (round(row["t"], 2), row.get("note"))
        if key in seen:
            continue
        logs = row.get("logs") or []
        if not logs:
            continue
        last = logs[-1]
        stamp = round(last["t"], 2)
        if stamp in seen:
            continue
        seen.add(stamp)
        place(click(), last["t"], 0.22 if last["kind"] != "print" else 0.12)

    place(lock_tone(), 15.7, 0.55)

    # soft lift while paper is green
    lift = np.clip((t - 16.5) / 2.0, 0, 1) * np.clip((36.8 - t) / 3.0, 0, 1)
    mix += lift * 0.035 * np.sin(2 * np.pi * 330 * t)

    mix = np.tanh(mix * 1.15)
    peak = np.max(np.abs(mix)) or 1
    mix = mix / peak * 0.9
    stereo = np.column_stack((mix * 0.98, mix))
    pcm = (stereo * 32767).astype(np.int16)
    ASSETS.mkdir(exist_ok=True)
    with wave.open(str(WAV), "w") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(pcm.tobytes())


def main() -> None:
    if not TAPE.exists():
        raise SystemExit("run node scripts/dump-tape.mjs first")
    tape = json.loads(TAPE.read_text(encoding="utf-8"))
    write_bed(tape)
    ASSETS.mkdir(exist_ok=True)
    silent = ASSETS / "ghostfill_silent.mp4"
    proc = subprocess.Popen(
        [
            "ffmpeg", "-y",
            "-f", "rawvideo", "-pix_fmt", "rgb24",
            "-s", f"{W}x{H}", "-r", str(FPS),
            "-i", "pipe:0",
            "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "17",
            str(silent),
        ],
        stdin=subprocess.PIPE,
    )
    still_saved = False
    n = len(tape)
    for i, s in enumerate(tape):
        im = draw_frame(s).convert("RGB")
        proc.stdin.write(im.tobytes())
        if not still_saved and s["t"] >= 33.2:
            im.save(STILL)
            still_saved = True
        if i % 60 == 0:
            print(f"{i}/{n}")
    proc.stdin.close()
    if proc.wait() != 0:
        raise SystemExit("ffmpeg video failed")
    subprocess.run(
        [
            "ffmpeg", "-y", "-i", str(silent), "-i", str(WAV),
            "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
            "-shortest", "-movflags", "+faststart",
            str(OUT),
        ],
        check=True,
    )
    silent.unlink(missing_ok=True)
    print("wrote", OUT)


if __name__ == "__main__":
    main()
