display.setStatusBar(display.HiddenStatusBar)

local W, H = display.contentWidth, display.contentHeight
local cx = display.contentCenterX
local cy = display.contentCenterY
local ink = { 0.11, 0.13, 0.18 }
local cream = { 0.94, 0.87, 0.69 }
local gold = { 0.88, 0.65, 0.29 }
local muted = { 0.64, 0.67, 0.72 }

local game = {
    found = {},
    solved = false,
    modal = nil,
}

local function text(parent, value, x, y, size, color, options)
    options = options or {}
    local obj = display.newText({
        parent = parent,
        text = value,
        x = x,
        y = y,
        width = options.width,
        height = options.height,
        font = options.font or native.systemFont,
        fontSize = size,
        align = options.align or "center",
    })
    obj:setFillColor(unpack(color or cream))
    obj.isHitTestable = false
    return obj
end

local function rect(parent, x, y, w, h, color, radius)
    local obj
    if radius then
        obj = display.newRoundedRect(parent, x, y, w, h, radius)
    else
        obj = display.newRect(parent, x, y, w, h)
    end
    obj:setFillColor(unpack(color))
    return obj
end

local function clearGroup(group)
    if group then
        display.remove(group)
    end
end

local function clearModal()
    clearGroup(game.modal)
    game.modal = nil
end

local function modalBackdrop(group, opacity)
    local backdrop = rect(group, cx, cy, 360, 640, { 0.02, 0.03, 0.06, opacity })
    backdrop:addEventListener("tap", function()
        return true
    end)
end

local function showMessage(title, message)
    clearModal()
    local group = display.newGroup()
    game.modal = group
    modalBackdrop(group, 0.72)
    rect(group, cx, cy, 318, 240, { 0.12, 0.15, 0.21 }, 16)
    text(group, title, cx, cy - 72, 24, gold)
    text(group, message, cx, cy - 13, 17, cream, { width = 270, height = 95 })
    local close = rect(group, cx, cy + 78, 142, 42, { 0.39, 0.29, 0.19 }, 10)
    text(group, "CONTINUE", cx, cy + 78, 15, cream)
    close:addEventListener("tap", function()
        clearModal()
        return true
    end)
end

local function showEnding()
    clearModal()
    local group = display.newGroup()
    game.modal = group
    modalBackdrop(group, 0.88)
    rect(group, cx, cy, 322, 310, { 0.12, 0.15, 0.21 }, 16)
    text(group, "THE LAST CONSTELLATION", cx, cy - 120, 21, gold)
    text(group,
        "The telescope finds a hidden star—and a message from the astronomer who vanished a century ago.\n\n“Some mysteries are maps home.”",
        cx, cy - 24, 17, cream, { width = 270, height = 160 })
    local again = rect(group, cx, cy + 111, 178, 42, { 0.39, 0.29, 0.19 }, 10)
    text(group, "PLAY AGAIN", cx, cy + 111, 15, cream)
    again:addEventListener("tap", function()
        game.found = {}
        game.solved = false
        clearModal()
        return true
    end)
end

local function showPuzzle()
    clearModal()
    local group = display.newGroup()
    game.modal = group
    modalBackdrop(group, 0.82)
    rect(group, cx, cy, 322, 382, { 0.12, 0.15, 0.21 }, 16)
    text(group, "THE CELESTIAL LOCK", cx, cy - 158, 22, gold)
    text(group, "Use your clues to align the three dials.", cx, cy - 117, 15, cream)
    local symbols = { "MOON", "STAR", "SUN" }
    local solution = { 1, 2, 3 }
    local picks = { 1, 1, 1 }
    local labels = {}
    local names = { "MOON", "STAR", "SUN" }

    for i = 1, 3 do
        local rowY = cy - 52 + (i - 1) * 62
        text(group, "DIAL " .. i, cx - 93, rowY, 14, muted)
        local button = rect(group, cx + 32, rowY, 128, 40, { 0.24, 0.28, 0.35 }, 9)
        labels[i] = text(group, names[picks[i]], cx + 32, rowY, 16, cream)
        button:addEventListener("tap", function()
            picks[i] = (picks[i] % #symbols) + 1
            labels[i].text = names[picks[i]]
            return true
        end)
    end

    local feedback = text(group, "", cx, cy + 169, 14, { 1, 0.55, 0.43 })
    local submit = rect(group, cx, cy + 132, 160, 44, { 0.39, 0.29, 0.19 }, 10)
    text(group, "UNLOCK", cx, cy + 132, 16, cream)
    submit:addEventListener("tap", function()
        if picks[1] == solution[1] and picks[2] == solution[2] and picks[3] == solution[3] then
            game.solved = true
            showEnding()
        else
            feedback.text = "The stars refuse to align."
        end
        return true
    end)

    local close = rect(group, cx, cy + 191, 100, 34, { 0.24, 0.28, 0.35 }, 8)
    text(group, "CLOSE", cx, cy + 191, 13, cream)
    close:addEventListener("tap", function()
        clearModal()
        return true
    end)
end

local function foundItem(id, title, description)
    if game.found[id] then
        showMessage(title, description .. "\n\nYou already have this clue.")
        return
    end
    game.found[id] = true
    showMessage(title, description)
end

local function makeHotspot(parent, x, y, label, callback, width)
    local button = rect(parent, x, y, width or 112, 38, { 0.08, 0.10, 0.15, 0.9 }, 8)
    button.strokeWidth = 1
    button:setStrokeColor(unpack(gold))
    text(parent, label, x, y, 13, cream)
    button:addEventListener("tap", function()
        callback()
        return true
    end)
end

local function buildRoom()
    local group = display.newGroup()
    rect(group, cx, 214, 360, 428, { 0.16, 0.19, 0.25 })
    rect(group, cx, 421, 360, 214, { 0.24, 0.19, 0.16 })
    rect(group, cx, 424, 360, 8, { 0.43, 0.31, 0.21 })

    text(group, "WHISPERING OBSERVATORY", cx, 34, 20, gold)
    text(group, "A century-old disappearance. Three clues. One star left unseen.", cx, 62, 12, muted, { width = 330, height = 26 })

    rect(group, cx, 175, 174, 154, { 0.07, 0.10, 0.17 }, 8)
    for i = 1, 14 do
        local sx = 107 + (i * 37 % 146)
        local sy = 115 + (i * 29 % 116)
        local star = display.newCircle(group, sx, sy, (i % 3) + 1)
        star:setFillColor(0.9, 0.82, 0.59, 0.8)
    end
    rect(group, cx, 254, 177, 6, { 0.43, 0.31, 0.21 })
    rect(group, cx - 88, 177, 7, 158, { 0.43, 0.31, 0.21 })
    rect(group, cx + 88, 177, 7, 158, { 0.43, 0.31, 0.21 })

    rect(group, 68, 327, 78, 88, { 0.32, 0.23, 0.17 }, 5)
    rect(group, 68, 327, 64, 72, { 0.73, 0.62, 0.43 }, 3)
    text(group, "?", 68, 327, 38, { 0.23, 0.17, 0.13 })
    rect(group, 292, 327, 78, 88, { 0.32, 0.23, 0.17 }, 5)
    rect(group, 292, 327, 64, 72, { 0.36, 0.42, 0.45 }, 3)
    text(group, "✦", 292, 327, 30, gold)

    rect(group, cx, 382, 174, 23, { 0.42, 0.29, 0.18 }, 4)
    rect(group, cx - 68, 410, 8, 41, { 0.31, 0.21, 0.15 })
    rect(group, cx + 68, 410, 8, 41, { 0.31, 0.21, 0.15 })
    rect(group, 180, 364, 44, 30, { 0.19, 0.22, 0.28 }, 4)
    rect(group, 180, 359, 25, 4, gold)
    rect(group, 245, 372, 15, 10, { 0.72, 0.59, 0.36 }, 4)

    rect(group, 282, 286, 78, 8, { 0.43, 0.31, 0.21 }, 4)
    rect(group, 282, 306, 6, 34, { 0.43, 0.31, 0.21 })
    rect(group, 282, 286, 33, 6, { 0.52, 0.60, 0.67 }, 4)
    rect(group, 263, 286, 8, 6, gold)

    text(group, "Tap around the room to investigate.", cx, 456, 14, cream)
    makeHotspot(group, 65, 506, "RUG", function()
        foundItem("key", "A BRASS KEY", "A tiny key glints beneath the rug. It must fit something in this room.")
    end, 100)
    makeHotspot(group, 177, 506, "PORTRAIT", function()
        foundItem("chart", "STAR CHART", "A folded chart was hidden behind the portrait. The marked order is Moon, Star, Sun.")
    end, 100)
    makeHotspot(group, 292, 506, "TELESCOPE", function()
        if game.solved then
            showEnding()
        elseif game.found.key and game.found.chart and game.found.note then
            showPuzzle()
        else
            showMessage("THE TELESCOPE", "The brass lock needs three clues from the room before it can be opened.")
        end
    end, 112)

    makeHotspot(group, 112, 560, "DESK", function()
        if not game.found.key then
            showMessage("LOCKED DRAWER", "The desk drawer is locked. Search the room for a key.")
        else
            foundItem("note", "THE ASTRONOMER'S NOTE", "The key opens a hidden drawer. Inside: “Moon, Star, Sun. Look where the night has no end.”")
        end
    end, 106)
    makeHotspot(group, 250, 560, "JOURNAL", function()
        showMessage("CASE JOURNAL", "Clues found: " ..
            (game.found.key and "Key " or "") ..
            (game.found.chart and "Chart " or "") ..
            (game.found.note and "Note" or ""))
    end, 112)
    return group
end

local function startGame()
    local menu = display.newGroup()
    rect(menu, cx, cy, 360, 640, { 0.08, 0.10, 0.15 })
    text(menu, "THE", cx, 197, 20, cream)
    text(menu, "WHISPERING", cx, 236, 38, gold)
    text(menu, "OBSERVATORY", cx, 278, 34, cream)
    text(menu, "A hidden-object mystery", cx, 335, 17, muted)
    text(menu, "The astronomer vanished. The stars remember.", cx, 371, 13, muted, { width = 310, height = 32 })
    local begin = rect(menu, cx, 447, 190, 52, { 0.39, 0.29, 0.19 }, 12)
    text(menu, "BEGIN INVESTIGATION", cx, 447, 15, cream)
    begin:addEventListener("tap", function()
        clearGroup(menu)
        buildRoom()
        showMessage("CASE NO. 7", "Professor Vale vanished from this observatory in 1924. Find the hidden clues and discover what he left behind.")
        return true
    end)
end

startGame()
