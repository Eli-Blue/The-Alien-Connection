class_name HiddenObject
extends Area2D
## Clickable hidden item built from an entry in hidden_objects.json.

signal found(object_id: String)

var object_id := ""
var object_name := ""
var description := ""
var clue := ""


func setup(def: Dictionary) -> void:
	object_id = def.get("id", "")
	object_name = def.get("name", "")
	description = def.get("description", "")
	clue = def.get("clue", "")
	position = Vector2(def.get("x", 0), def.get("y", 0))
	var shape := CollisionShape2D.new()
	var rect := RectangleShape2D.new()
	rect.size = Vector2(def.get("width", 32), def.get("height", 32))
	shape.shape = rect
	add_child(shape)
	input_pickable = true


func _input_event(_viewport: Viewport, event: InputEvent, _shape_idx: int) -> void:
	if event is InputEventMouseButton and event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
		if GameState.mark_hidden_object_found(object_id):
			found.emit(object_id)
			queue_free()
