extends Node
## Loads story logs, hidden-object definitions and puzzle parameters from JSON.

const DATA_DIR := "res://assets/data/"

var logs: Dictionary = {}
var hidden_objects: Array = []
var puzzles: Dictionary = {}


func _ready() -> void:
	for entry in _load_json("logs.json", []):
		logs[entry["id"]] = entry
	hidden_objects = _load_json("hidden_objects.json", [])
	puzzles = _load_json("puzzles.json", {})


func get_log(id: String) -> Dictionary:
	return logs.get(id, {})


func _load_json(file_name: String, fallback: Variant) -> Variant:
	var file := FileAccess.open(DATA_DIR + file_name, FileAccess.READ)
	if file == null:
		push_error("Cannot open " + DATA_DIR + file_name)
		return fallback
	var parsed: Variant = JSON.parse_string(file.get_as_text())
	return fallback if parsed == null else parsed
