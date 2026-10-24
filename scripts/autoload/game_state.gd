extends Node
## Port of src/state/GameState.ts (without persistence).

signal changed

var current_scene := "AirlockScene"
var chapter := 1
var power_restored := false
var airlock_unlocked := false
var found_hidden_objects: Array[String] = []
var hidden_objects_completed := false
var oscilloscope_solved := false
var keypad_solved := false
var chapter_completed := false
var discovered_logs: Array[String] = ["log_01_briefing"]
var inventory: Array[Dictionary] = []


func reset() -> void:
	current_scene = "AirlockScene"
	chapter = 1
	power_restored = false
	airlock_unlocked = false
	found_hidden_objects.clear()
	hidden_objects_completed = false
	oscilloscope_solved = false
	keypad_solved = false
	chapter_completed = false
	discovered_logs = ["log_01_briefing"]
	inventory.clear()
	changed.emit()


func add_item(item: Dictionary) -> bool:
	if has_item(item.get("id", "")):
		return false
	inventory.append(item)
	changed.emit()
	return true


func has_item(item_id: String) -> bool:
	for item in inventory:
		if item.get("id") == item_id:
			return true
	return false


func discover_log(log_id: String) -> bool:
	if DataLoader.get_log(log_id).is_empty() or log_id in discovered_logs:
		return false
	discovered_logs.append(log_id)
	changed.emit()
	return true


func mark_hidden_object_found(object_id: String) -> bool:
	if object_id in found_hidden_objects:
		return false
	found_hidden_objects.append(object_id)
	changed.emit()
	return true
