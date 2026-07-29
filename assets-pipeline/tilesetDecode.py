import struct, sys, os
from PIL import Image

def load_pal(path):
    with open(path, 'r') as f:
        lines = f.read().splitlines()
    n = int(lines[2])
    colors = []
    for i in range(n):
        r,g,b = map(int, lines[3+i].split())
        colors.append((r,g,b))
    return colors

def load_tiles(png_path):
    im = Image.open(png_path)
    assert im.mode == 'P'
    w,h = im.size
    cols = w // 8
    rows = h // 8
    data = list(im.getdata())
    tiles = []
    for r in range(rows):
        for c in range(cols):
            tile = []
            for ty in range(8):
                row = []
                for tx in range(8):
                    px = data[(r*8+ty)*w + (c*8+tx)]
                    row.append(px)
                tile.append(row)
            tiles.append(tile)
    return tiles  # list of 8x8 arrays of palette-index (0-15)

def get_tile_pixels(tile, xflip, yflip):
    rows = range(7,-1,-1) if yflip else range(8)
    cols = range(7,-1,-1) if xflip else range(8)
    out = []
    for ty in rows:
        row = []
        for tx in cols:
            row.append(tile[ty][tx])
        out.append(row)
    return out

def render_tileset(primary_dir, secondary_dir, out_path, cols=16):
    prim_tiles = load_tiles(os.path.join(primary_dir, 'tiles.png'))
    sec_tiles = load_tiles(os.path.join(secondary_dir, 'tiles.png')) if secondary_dir else []
    all_tiles = prim_tiles + sec_tiles  # index 0..511 primary, 512.. secondary

    pals = {}
    def get_pal(pdir, idx):
        key = (pdir, idx)
        if key not in pals:
            p = os.path.join(pdir, 'palettes', f'{idx:02d}.pal')
            pals[key] = load_pal(p) if os.path.exists(p) else [(255,0,255)]*16
        return pals[key]

    with open(os.path.join(primary_dir, 'metatiles.bin'), 'rb') as f:
        prim_meta = f.read()
    sec_meta = b''
    if secondary_dir:
        with open(os.path.join(secondary_dir, 'metatiles.bin'), 'rb') as f:
            sec_meta = f.read()

    n_prim = len(prim_meta)//16
    n_sec = len(sec_meta)//16
    total = n_prim + n_sec

    rows_out = (total + cols - 1)//cols
    atlas = Image.new('RGBA', (cols*16, rows_out*16), (0,0,0,0))

    def decode_entry(u16):
        tile_id = u16 & 0x3FF
        xflip = (u16 >> 10) & 1
        yflip = (u16 >> 11) & 1
        pal = (u16 >> 12) & 0xF
        return tile_id, xflip, yflip, pal

    def draw_metatile(mid, raw, pal_dir_for_id):
        entries = struct.unpack('<8H', raw)
        # entries[0:4] = bottom layer TL,TR,BL,BR ; entries[4:8] = top layer TL,TR,BL,BR
        mx = (mid % cols)*16
        my = (mid // cols)*16
        for layer in range(2):
            quad = entries[layer*4:layer*4+4]
            positions = [(0,0),(8,0),(0,8),(8,8)]
            for (dx,dy), u16 in zip(positions, quad):
                tile_id, xflip, yflip, pal = decode_entry(u16)
                if tile_id == 0 and u16 == 0 and layer==1:
                    continue
                if tile_id >= len(all_tiles):
                    continue
                tile = all_tiles[tile_id]
                pdir = primary_dir if tile_id < 512 else secondary_dir
                colors = get_pal(pdir, pal)
                px = get_tile_pixels(tile, xflip, yflip)
                for ty in range(8):
                    for tx in range(8):
                        idx = px[ty][tx]
                        if idx == 0:
                            continue  # transparent
                        c = colors[idx] if idx < len(colors) else (255,0,255)
                        atlas.putpixel((mx+dx+tx, my+dy+ty), (c[0],c[1],c[2],255))

    for mid in range(n_prim):
        raw = prim_meta[mid*16:mid*16+16]
        draw_metatile(mid, raw, primary_dir)
    for i in range(n_sec):
        raw = sec_meta[i*16:i*16+16]
        draw_metatile(n_prim+i, raw, secondary_dir)

    atlas.save(out_path)
    print(f'Saved {out_path} ({total} metatiles, {cols}x{rows_out} grid)')
    return total

if __name__ == '__main__':
    primary_dir = sys.argv[1]
    secondary_dir = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] != '-' else None
    out_path = sys.argv[3]
    render_tileset(primary_dir, secondary_dir, out_path)
