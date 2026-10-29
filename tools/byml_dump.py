"""Dump the BYML (v3, little endian) embedded in an SMO save file to JSON."""
import json, struct, sys

def u32(d, o): return struct.unpack_from('<I', d, o)[0]
def i32(d, o): return struct.unpack_from('<i', d, o)[0]

def find_byml(d):
    i = d.find(b'YB\x03\x00')
    if i < 0: raise SystemExit('no BYML header')
    return i

def read_table(d, base, off):
    o = base + off
    assert d[o] == 0xC2, hex(d[o])
    n = u32(d, o) >> 8
    offs = [u32(d, o + 4 + 4 * i) for i in range(n + 1)]
    out = []
    for i in range(n):
        s = o + offs[i]
        out.append(d[s:d.index(b'\0', s)].decode('utf-8'))
    return out

class Byml:
    def __init__(self, d):
        self.d = d
        self.b = find_byml(d)
        self.names = read_table(d, self.b, u32(d, self.b + 4))
        so = u32(d, self.b + 8)
        self.strs = read_table(d, self.b, so) if so else []
        self.root = u32(d, self.b + 12)

    def node(self, t, v):
        d, b = self.d, self.b
        if t == 0xD0: return bool(v)
        if t == 0xD1: return struct.unpack('<i', struct.pack('<I', v))[0]
        if t == 0xD2: return struct.unpack('<f', struct.pack('<I', v))[0]
        if t == 0xD3: return v
        if t == 0xA0: return self.strs[v]
        if t == 0xD4: return struct.unpack_from('<q', d, b + v)[0]
        if t == 0xD5: return struct.unpack_from('<Q', d, b + v)[0]
        if t == 0xD6: return struct.unpack_from('<d', d, b + v)[0]
        if t == 0xC1:
            o = b + v; n = u32(d, o) >> 8; r = {}
            for i in range(n):
                e = o + 4 + 8 * i
                k = u32(d, e) & 0xFFFFFF; et = d[e + 3]
                r[self.names[k]] = self.node(et, u32(d, e + 4))
            return r
        if t == 0xC0:
            o = b + v; n = u32(d, o) >> 8
            vo = o + 4 + ((n + 3) & ~3)
            return [self.node(d[o + 4 + i], u32(d, vo + 4 * i)) for i in range(n)]
        return {'__type': hex(t), '__val': v}

    def dump(self):
        t = self.d[self.b + self.root]
        return self.node(t, self.root)

if __name__ == '__main__':
    d = open(sys.argv[1], 'rb').read()
    print(json.dumps(Byml(d).dump(), indent=1, ensure_ascii=False))
