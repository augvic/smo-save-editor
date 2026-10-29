//! CRC-32 (IEEE, the same one zlib and PNG use). Small enough not to need a dependency.

/// Computes the checksum the game stores in the first four bytes of every save.
pub struct Crc32;

impl Crc32 {
    pub fn checksum(data: &[u8]) -> u32 {
        let mut crc = !0u32;
        for &byte in data {
            crc ^= byte as u32;
            for _ in 0..8 {
                // 0xEDB88320 is the bit-reversed IEEE polynomial.
                crc = if crc & 1 != 0 { (crc >> 1) ^ 0xEDB8_8320 } else { crc >> 1 };
            }
        }
        !crc
    }
}
