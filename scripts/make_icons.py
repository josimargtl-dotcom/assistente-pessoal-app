"""
Gera os assets visuais do anjel: ícone do app, camadas do ícone adaptativo
(Android) e o feature graphic da Play Store — tudo a partir da identidade
já usada no protótipo (navy + brass + o traço do "horizonte").
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

INK = (22, 33, 62)        # #16213E
INK_DEEP = (13, 20, 38)   # sombra mais escura pro degradê de fundo
BRASS = (180, 133, 74)    # #B4854A
GOLD = (216, 178, 124)    # #D8B27C

def lerp(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def horizontal_gradient(size, stops):
    """stops: list of (position 0-1, color) — gera um degradê horizontal suave."""
    w, h = size
    arr = np.zeros((h, w, 3), dtype=np.uint8)
    xs = np.linspace(0, 1, w)
    colors = np.zeros((w, 3), dtype=np.uint8)
    for i, x in enumerate(xs):
        for j in range(len(stops) - 1):
            p0, c0 = stops[j]
            p1, c1 = stops[j + 1]
            if p0 <= x <= p1:
                t = (x - p0) / (p1 - p0) if p1 > p0 else 0
                colors[i] = lerp(c0, c1, t)
                break
        else:
            colors[i] = stops[-1][1]
    arr[:, :] = colors
    return Image.fromarray(arr, "RGB")

def make_sun_glyph(size, bg=None):
    """Círculo em degradê (brass->gold) cortado por uma linha de horizonte,
    representando o nascer do sol — a assinatura visual do anjel."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    circle_mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(circle_mask)
    margin = int(size * 0.14)
    d.ellipse([margin, margin, size - margin, size - margin], fill=255)

    grad = horizontal_gradient((size, size), [(0.0, BRASS), (0.55, GOLD), (1.0, BRASS)])
    sun = Image.composite(grad.convert("RGBA"), Image.new("RGBA", (size, size), (0, 0, 0, 0)), circle_mask)
    img = Image.alpha_composite(img, sun)

    # Linha do horizonte: uma faixa fina cruzando o centro, na cor de fundo
    # (cria o efeito "meio sol se pondo/nascendo no horizonte")
    horizon = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    hd = ImageDraw.Draw(horizon)
    line_y = int(size * 0.565)
    line_h = max(6, int(size * 0.018))
    fill_color = bg if bg else INK
    hd.rectangle([0, line_y, size, line_y + line_h], fill=fill_color + (255,))
    img = Image.alpha_composite(img, horizon)
    return img

def make_icon(path, size=1024, transparent_bg=False, glyph_scale=0.62):
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0) if transparent_bg else INK + (255,))
    glyph_size = int(size * glyph_scale)
    glyph = make_sun_glyph(glyph_size, bg=None if transparent_bg else INK)
    offset = ((size - glyph_size) // 2, (size - glyph_size) // 2)
    canvas.alpha_composite(glyph, offset)
    canvas.save(path)

def make_solid(path, size, color):
    Image.new("RGBA", (size, size), color + (255,)).save(path)

def make_feature_graphic(path, w=1024, h=500):
    img = horizontal_gradient((w, h), [(0.0, INK_DEEP), (0.55, INK), (1.0, INK)]).convert("RGBA")
    glyph_size = int(h * 0.62)
    glyph = make_sun_glyph(glyph_size, bg=INK)
    img.alpha_composite(glyph, (int(w * 0.06), (h - glyph_size) // 2))

    d = ImageDraw.Draw(img)
    try:
        from PIL import ImageFont
        font = ImageFont.truetype("/mnt/skills/examples/canvas-design/canvas-fonts/Lora-Bold.ttf", 92)
        font_small = ImageFont.truetype("/mnt/skills/examples/canvas-design/canvas-fonts/InstrumentSans-Regular.ttf", 34)
    except Exception:
        font = None
        font_small = None

    text_x = int(w * 0.06) + glyph_size + 30
    if font:
        d.text((text_x, h * 0.32), "anjel", font=font, fill=(255, 255, 255, 255))
        d.text((text_x + 4, h * 0.32 + 105), "seu assistente pessoal", font=font_small, fill=(216, 178, 124, 255))
    img.save(path)

# ---- Gera tudo ----
make_icon("/home/claude/anjel-app/assets/icon.png", size=1024, transparent_bg=False)
make_icon("/home/claude/anjel-app/assets/adaptive-icon-foreground.png", size=1024, transparent_bg=True, glyph_scale=0.52)
make_solid("/home/claude/anjel-app/assets/adaptive-icon-background.png", 1024, INK)
make_feature_graphic("/home/claude/anjel-app/store/feature-graphic.png")

print("ok")
