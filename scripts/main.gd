extends Control
## Entry point. Shows the opening briefing log loaded from assets/data/logs.json.

@onready var log_label: RichTextLabel = $Log


func _ready() -> void:
	var log_entry := DataLoader.get_log("log_01_briefing")
	log_label.text = "[b]%s[/b]\n%s — %s\n\n%s" % [
		log_entry.get("title", ""),
		log_entry.get("sender", ""),
		log_entry.get("timestamp", ""),
		log_entry.get("content", ""),
	]
	log_label.bbcode_enabled = true
