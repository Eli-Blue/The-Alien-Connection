class_name OscilloscopePuzzle
extends PuzzleBase

var frequency := 0.0
var harmonic := 0.0


func is_solved() -> bool:
	var cfg: Dictionary = DataLoader.puzzles.get("oscilloscope", {})
	return absf(frequency - cfg.get("target_freq", 0.0)) <= cfg.get("freq_tolerance", 0.0) \
		and absf(harmonic - cfg.get("target_harmonic", 0.0)) <= cfg.get("harmonic_tolerance", 0.0)
