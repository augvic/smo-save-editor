use serde_json::json;
use smo_save_editor_lib::save_format::{JsonBridge, Node};

#[test]
fn big_64_bit_values_become_strings() {
    assert_eq!(JsonBridge::to_json(&Node::UInt64(5)), json!(5));
    assert_eq!(JsonBridge::to_json(&Node::UInt64(u64::MAX)), json!("18446744073709551615"));
}

#[test]
fn set_keeps_the_type_and_checks_ranges() {
    let mut n = Node::Int(0);
    JsonBridge::set(&mut n, &json!(-7)).unwrap();
    assert_eq!(n, Node::Int(-7));
    assert!(JsonBridge::set(&mut n, &json!(5_000_000_000u64)).is_err());
    assert!(JsonBridge::set(&mut n, &json!("x")).is_err());

    let mut big = Node::UInt64(0);
    JsonBridge::set(&mut big, &json!("18446744073709551615")).unwrap();
    assert_eq!(big, Node::UInt64(u64::MAX));
}

#[test]
fn a_list_can_grow_and_its_new_objects_come_out_sorted() {
    let mut list = Node::Array(vec![]);
    JsonBridge::set(
        &mut list,
        &json!([{ "IsCollected": true, "BgmResourceName": "StmRsBgmHat" }, "Stage", 3, false]),
    )
    .unwrap();
    let Node::Array(items) = &list else { panic!("still a list") };
    assert_eq!(items.len(), 4);
    assert_eq!(
        items[0],
        Node::Dict(vec![
            ("BgmResourceName".into(), Node::String("StmRsBgmHat".into())),
            ("IsCollected".into(), Node::Bool(true)),
        ])
    );
    assert_eq!(items[2], Node::Int(3));
}

#[test]
fn an_object_still_cannot_be_replaced_and_a_list_needs_a_list() {
    let mut dict = Node::Dict(vec![]);
    assert!(JsonBridge::set(&mut dict, &json!([])).is_err());
    let mut list = Node::Array(vec![]);
    assert!(JsonBridge::set(&mut list, &json!(5)).is_err());
    assert!(JsonBridge::set(&mut list, &json!([null])).is_err());
}
