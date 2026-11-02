class_name KeypadPuzzle
extends PuzzleBase

var entry := ""


func is_solved() -> bool:
	return entry == str(DataLoader.puzzles.get("keypad", {}).get("code", ""))
