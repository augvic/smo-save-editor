"""Read Yaz0-compressed SARC archives (.szs) and the BYML files inside. Usage:
   szs.py list ARCHIVE
   szs.py dump ARCHIVE MEMBER OUT.json"""
import struct, sys, json

def yaz0(d):
    if d[:4] != b'Yaz0': return d
    size = struct.unpack('>I', d[4:8])[0]; out = bytearray(); i = 16
    while len(out) < size:
        code = d[i]; i += 1
        for b in range(8):
            if len(out) >= size: break
            if code & (0x80 >> b): out.append(d[i]); i += 1
            else:
                b1, b2 = d[i], d[i+1]; i += 2
                dist = ((b1 & 0xF) << 8 | b2) + 1; n = b1 >> 4
                if n == 0: n = d[i] + 0x12; i += 1
                else: n += 2
                for _ in range(n): out.append(out[-dist])
    return bytes(out)

def sarc(d):
    assert d[:4] == b'SARC', d[:4]
    e = '>' if d[6:8] == b'\xfe\xff' else '<'
    data_off = struct.unpack(e+'I', d[0xC:0x10])[0]
    cnt = struct.unpack(e+'H', d[0x1A:0x1C])[0]
    names_off = 0x20 + 16*cnt + 8
    files = {}
    for i in range(cnt):
        h, attr, s, en = struct.unpack(e+'IIII', d[0x20+16*i:0x30+16*i])
        no = names_off + (attr & 0xFFFFFF) * 4
        files[d[no:d.index(b'\0', no)].decode()] = d[data_off+s:data_off+en]
    return files

def byml(d):
    e = '>' if d[:2] == b'BY' else '<'
    def u32(o): return struct.unpack(e+'I', d[o:o+4])[0]
    def u24(o): return int.from_bytes(d[o+1:o+4], 'big' if e == '>' else 'little')
    def key(o): return int.from_bytes(d[o:o+3], 'big' if e == '>' else 'little')
    def table(off):
        n = u24(off); offs = [u32(off+4+4*i) for i in range(n+1)]
        return [d[off+offs[i]:d.index(b'\0', off+offs[i])].decode('utf-8','replace') for i in range(n)]
    names = table(u32(4)); strs = table(u32(8)) if u32(8) else []
    def val(t, v):
        if t == 0xA0: return strs[v]
        if t == 0xD0: return bool(v)
        if t == 0xD1: return struct.unpack(e+'i', struct.pack(e+'I', v))[0]
        if t == 0xD2: return struct.unpack(e+'f', struct.pack(e+'I', v))[0]
        if t == 0xD3: return v
        if t == 0xD4: return struct.unpack(e+'q', d[v:v+8])[0]
        if t == 0xD5: return struct.unpack(e+'Q', d[v:v+8])[0]
        if t == 0xD6: return struct.unpack(e+'d', d[v:v+8])[0]
        if t == 0xC1:
            n = u24(v); r = {}
            for i in range(n):
                o = v+4+8*i; r[names[key(o)]] = val(d[o+3], u32(o+4))
            return r
        if t == 0xC0:
            n = u24(v); pad = (n+3) & ~3
            return [val(d[v+4+i], u32(v+4+pad+4*i)) for i in range(n)]
        return {'__type': hex(t), '__val': v}
    root = u32(12)
    return val(d[root], root)

if __name__ == '__main__':
    cmd, path = sys.argv[1], sys.argv[2]
    files = sarc(yaz0(open(path, 'rb').read()))
    if cmd == 'list':
        for k, v in sorted(files.items()): print(f'{len(v):>9}  {k}')
    else:
        json.dump(byml(files[sys.argv[3]]), open(sys.argv[4], 'w'), indent=1, ensure_ascii=False)
