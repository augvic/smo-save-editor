"""Dump the BYML files inside an SMO ItemList.szs (Yaz0 + SARC) to JSON.
Usage: python3 tools/itemlist_dump.py ItemList.szs out.json"""
import struct, sys, json

def yaz0(d):
    assert d[:4] == b'Yaz0'
    size = struct.unpack('>I', d[4:8])[0]
    out = bytearray(); i = 16
    while len(out) < size:
        code = d[i]; i += 1
        for b in range(8):
            if len(out) >= size: break
            if code & (0x80 >> b):
                out.append(d[i]); i += 1
            else:
                b1, b2 = d[i], d[i+1]; i += 2
                dist = ((b1 & 0xF) << 8 | b2) + 1
                n = b1 >> 4
                if n == 0: n = d[i] + 0x12; i += 1
                else: n += 2
                for _ in range(n): out.append(out[-dist])
    return bytes(out)

def sarc(d):
    assert d[:4] == b'SARC'
    bom = d[6:8]; e = '>' if bom == b'\xfe\xff' else '<'
    data_off = struct.unpack(e+'I', d[0xC:0x10])[0]
    assert d[0x14:0x18] == b'SFAT'
    cnt = struct.unpack(e+'H', d[0x1A:0x1C])[0]
    nodes = []
    for i in range(cnt):
        h, attr, s, en = struct.unpack(e+'IIII', d[0x20+16*i:0x30+16*i])
        nodes.append((attr, s, en))
    sfnt = 0x20 + 16*cnt
    names_off = sfnt + 8
    files = {}
    for attr, s, en in nodes:
        no = names_off + (attr & 0xFFFFFF) * 4
        name = d[no:d.index(b'\0', no)].decode()
        files[name] = d[data_off+s:data_off+en]
    return files

def byml(d):
    e = '>' if d[:2] == b'BY' else '<'
    ver = struct.unpack(e+'H', d[2:4])[0]
    def u32(o): return struct.unpack(e+'I', d[o:o+4])[0]
    def u24(o): return int.from_bytes(d[o+1:o+4], 'big' if e == '>' else 'little')  # count after the type byte
    def key(o): return int.from_bytes(d[o:o+3], 'big' if e == '>' else 'little')
    def table(off):
        n = u24(off)
        offs = [u32(off+4+4*i) for i in range(n+1)]
        return [d[off+offs[i]:d.index(b'\0', off+offs[i])].decode() for i in range(n)]
    names = table(u32(4)); strs = table(u32(8)) if u32(8) else []
    def val(t, v):
        if t == 0xA0: return strs[v]
        if t == 0xD0: return bool(v)
        if t == 0xD1: return struct.unpack(e+'i', struct.pack(e+'I', v))[0]
        if t == 0xD2: return struct.unpack(e+'f', struct.pack(e+'I', v))[0]
        if t == 0xD3: return v
        if t == 0xC1:
            n = u24(v); r = {}
            for i in range(n):
                o = v+4+8*i
                k = key(o); tt = d[o+3]
                r[names[k]] = val(tt, u32(o+4))
            return r
        if t == 0xC0:
            n = u24(v); pad = (n+3) & ~3
            return [val(d[v+4+i], u32(v+4+pad+4*i)) for i in range(n)]
        return {'__type': hex(t), '__val': v}
    root = u32(12)
    return val(d[root], root)

raw = yaz0(open(sys.argv[1], 'rb').read())
files = sarc(raw)
print('files:', {k: len(v) for k, v in files.items()}, file=sys.stderr)
out = {k: byml(v) for k, v in files.items() if v[:2] in (b'BY', b'YB')}
json.dump(out, open(sys.argv[2], 'w'), indent=1, ensure_ascii=False)
