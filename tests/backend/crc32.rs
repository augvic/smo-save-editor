use smo_save_editor_lib::save_format::crc32::Crc32;

#[test]
fn matches_the_standard_check_value() {
    assert_eq!(Crc32::checksum(b"123456789"), 0xCBF4_3926);
}
