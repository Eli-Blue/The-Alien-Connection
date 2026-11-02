extends Node
## Switches scenes by name from the scenes/ folder.

func go_to(scene_name: String) -> void:
	var path := "res://scenes/%s.tscn" % scene_name
	if not ResourceLoader.exists(path):
		push_error("Scene not found: " + path)
		return
	GameState.current_scene = scene_name
	get_tree().change_scene_to_file(path)
