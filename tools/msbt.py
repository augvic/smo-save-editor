"""Read the labels and texts of a Nintendo MSBT message file (the game's own English text lives in these).

    labels, texts = msbt(bytes)  # labels: index -> label name, texts: index -> string (with a trailing NUL)
"""
import struct
def msbt(b):
    assert b[:8] == b'MsgStdBn'
    bo = '<' if b[8:10] == b'\xff\xfe' else '>'
    n = struct.unpack(bo + 'H', b[0xE:0x10])[0]; pos = 0x20; lbl = {}; txt = []
    enc = 'utf-16-le' if bo == '<' else 'utf-16-be'
    for _ in range(n):
        tag = b[pos:pos+4]; size = struct.unpack(bo + 'I', b[pos+4:pos+8])[0]; d = b[pos+16:pos+16+size]
        if tag == b'LBL1':
            cnt = struct.unpack(bo + 'I', d[:4])[0]
            for i in range(cnt):
                c, off = struct.unpack(bo + 'II', d[4+8*i:12+8*i]); p = off
                for _ in range(c):
                    l = d[p]; name = d[p+1:p+1+l].decode(); idx = struct.unpack(bo + 'I', d[p+1+l:p+5+l])[0]; lbl[idx] = name; p += 5 + l
        if tag == b'TXT2':
            cnt = struct.unpack(bo + 'I', d[:4])[0]; offs = [struct.unpack(bo + 'I', d[4+4*i:8+4*i])[0] for i in range(cnt)] + [len(d)]
            txt = [d[offs[i]:offs[i+1]].decode(enc, errors='replace') for i in range(cnt)]
        pos += 16 + size; pos = (pos + 15) // 16 * 16
    return lbl, txt
