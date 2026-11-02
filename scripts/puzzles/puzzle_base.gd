class_name PuzzleBase
extends Node
## Base class for puzzles. Subclasses override is_solved().

signal solved

var _done := false


func is_solved() -> bool:
	return false


func check() -> bool:
	if not _done and is_solved():
		_done = true
		solved.emit()
	return _done
