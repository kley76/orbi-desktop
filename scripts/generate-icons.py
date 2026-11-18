
from PIL import Image, ImageDraw
from pathlib import Path

OUT = Path("assets")
OUT.mkdir(exist_ok=True)

S = 512
im = Image.new("RGBA", (S, S), (0, 0, 0, 0))
d = ImageDraw.Draw(im)

def box(coords, radius, color):
    d.rounded_rectangle(coords, radius=radius, fill=color)

# Fundo grafite
box((0, 0, 511, 511), 112, "#161A1F")

# Antena
d.line((310, 116, 333, 65), fill="#BFCAD0", width=12)
d.ellipse((319, 47, 347, 75), fill="#8BDD70")

# Corpo e laterais
box((43, 146, 469, 438), 112, "#BFCAD0")
box((24, 247, 66, 345), 18, "#93A4AD")
box((446, 247, 488, 345), 18, "#93A4AD")

# Rosto
box((86, 182, 426, 401), 84, "#101418")

# Olhos sorrindo
d.arc((150, 261, 215, 312), 180, 360,
      fill="#8BDD70", width=13)
d.arc((297, 261, 362, 312), 180, 360,
      fill="#8BDD70", width=13)

# Sorriso
d.arc((233, 306, 279, 339), 0, 180,
      fill="#8BDD70", width=7)

# Imagens do aplicativo
im.save(OUT / "icon.png")

im.save(
    OUT / "icon.ico",
    format="ICO",
    sizes=[
        (16, 16), (32, 32), (48, 48),
        (64, 64), (128, 128), (256, 256)
    ]
)

# Ícone pequeno da bandeja
tray = Image.new("RGBA", (64, 64), (0, 0, 0, 0))
td = ImageDraw.Draw(tray)
td.rounded_rectangle((5, 16, 59, 54),
                     radius=15, fill="#BFCAD0")
td.rounded_rectangle((12, 22, 52, 47),
                     radius=10, fill="#101418")
td.arc((17, 29, 29, 40), 180, 360,
       fill="#8BDD70", width=3)
td.arc((35, 29, 47, 40), 180, 360,
       fill="#8BDD70", width=3)
td.line((39, 17, 45, 8), fill="#BFCAD0", width=2)
td.ellipse((43, 5, 49, 11), fill="#8BDD70")
tray.save(OUT / "tray.png")

print("Icones do orbi gerados.")
