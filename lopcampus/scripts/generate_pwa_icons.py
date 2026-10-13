import zlib
import struct
import math
import os

def create_png(width, height, pixel_func):
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0)  # filter type 0 (None)
        for x in range(width):
            r, g, b, a = pixel_func(x, y, width, height)
            raw_data.extend([int(r), int(g), int(b), int(a)])
    
    compressed = zlib.compress(bytes(raw_data), level=9)
    
    def chunk(chunk_type, data):
        length = struct.pack(">I", len(data))
        crc = struct.pack(">I", zlib.crc32(chunk_type + data) & 0xffffffff)
        return length + chunk_type + data + crc

    png_header = b"\x89PNG\r\n\x1a\n"
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b"IHDR", ihdr_data)
    idat = chunk(b"IDAT", compressed)
    iend = chunk(b"IEND", b"")
    return png_header + ihdr + idat + iend

def lopcampus_pixel(x, y, w, h, maskable=False):
    # Normalized coords from -1 to 1
    nx = (x / (w - 1)) * 2 - 1
    ny = (y / (h - 1)) * 2 - 1
    dist = math.sqrt(nx * nx + ny * ny)

    # Base background: Royal Blue gradient
    # Top-left #2563eb (37, 99, 235), bottom-right #1e40af (30, 64, 175)
    t = (nx + ny + 2) / 4.0
    t = max(0.0, min(1.0, t))
    bg_r = 30 + 15 * t
    bg_g = 64 + 40 * t
    bg_b = 175 + 65 * t

    # If not maskable, we round the corners with a nice squircle / radius
    if not maskable:
        # rounded corners
        corner_r = 0.28
        ax = abs(nx)
        ay = abs(ny)
        if ax > (1.0 - corner_r) and ay > (1.0 - corner_r):
            dx = ax - (1.0 - corner_r)
            dy = ay - (1.0 - corner_r)
            if math.sqrt(dx * dx + dy * dy) > corner_r:
                return (0, 0, 0, 0) # Transparent outside rounded corner

    # Inner elements:
    # Safe zone for maskable is inside 80% (scale 0.72)
    s = 0.65 if maskable else 0.75
    px = nx / s
    py = ny / s

    # House Roof: Triangle from top (0, -0.65) to bottom-left (-0.6, -0.1) and bottom-right (0.6, -0.1)
    # Roof color: Emerald Green / Cyan #10b981 (16, 185, 129)
    in_roof = False
    if -0.65 <= py <= -0.1:
        roof_width = (py - (-0.65)) / (0.55) * 0.62
        if abs(px) <= roof_width:
            in_roof = True

    # House Body: Rect from py = -0.1 to 0.55, px from -0.48 to 0.48
    # Color: White #ffffff
    in_body = False
    if -0.1 <= py <= 0.52 and abs(px) <= 0.48:
        in_body = True

    # Door: Rect py 0.15 to 0.52, px -0.16 to 0.16
    # Color: Royal Blue / Amber
    in_door = False
    if 0.12 <= py <= 0.52 and abs(px) <= 0.16:
        # rounded top door
        if py < 0.24:
            dx = abs(px)
            dy = 0.24 - py
            if math.sqrt(dx * dx + dy * dy) <= 0.16:
                in_door = True
        else:
            in_door = True

    # Window left & right
    in_win1 = False
    if 0.02 <= py <= 0.24 and -0.40 <= px <= -0.22:
        in_win1 = True
    in_win2 = False
    if 0.02 <= py <= 0.24 and 0.22 <= px <= 0.40:
        in_win2 = True

    # Sun / Coin badge: circle at (0.42, -0.45), radius 0.14
    # Color: Amber #f59e0b (245, 158, 11)
    in_sun = False
    sdx = px - 0.40
    sdy = py - (-0.42)
    if math.sqrt(sdx * sdx + sdy * sdy) <= 0.15:
        in_sun = True

    if in_door:
        return (29, 78, 216, 255) # Blue door #1d4ed8
    if in_win1 or in_win2:
        return (16, 185, 129, 255) # Emerald window #10b981
    if in_sun:
        return (245, 158, 11, 255) # Amber badge #f59e0b
    if in_roof:
        return (16, 185, 129, 255) # Emerald roof
    if in_body:
        return (255, 255, 255, 255) # White house

    # Otherwise background
    return (int(bg_r), int(bg_g), int(bg_b), 255)

script_dir = os.path.dirname(os.path.abspath(__file__))
public_dir = os.path.join(script_dir, "..", "public")
os.makedirs(public_dir, exist_ok=True)

# Generate 512x512 standard
with open(os.path.join(public_dir, "pwa-512x512.png"), "wb") as f:
    f.write(create_png(512, 512, lambda x, y, w, h: lopcampus_pixel(x, y, w, h, False)))

# Generate 512x512 maskable
with open(os.path.join(public_dir, "pwa-maskable-512x512.png"), "wb") as f:
    f.write(create_png(512, 512, lambda x, y, w, h: lopcampus_pixel(x, y, w, h, True)))

# Generate 192x192
with open(os.path.join(public_dir, "pwa-192x192.png"), "wb") as f:
    f.write(create_png(192, 192, lambda x, y, w, h: lopcampus_pixel(x, y, w, h, False)))

# Generate 180x180 apple touch icon
with open(os.path.join(public_dir, "apple-touch-icon.png"), "wb") as f:
    f.write(create_png(180, 180, lambda x, y, w, h: lopcampus_pixel(x, y, w, h, False)))

# Generate favicon.ico (using 48x48 PNG embedded)
with open(os.path.join(public_dir, "favicon.ico"), "wb") as f:
    f.write(create_png(48, 48, lambda x, y, w, h: lopcampus_pixel(x, y, w, h, False)))

print("PWA PNG icons generated successfully!")
