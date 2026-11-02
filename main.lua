display.setStatusBar(display.HiddenStatusBar)
display.setDefault("background", 0.02, 0.04, 0.05)

local json = require("json")
local W, H = 960, 640
local green = { 0.20, 1.00, 0.53 }
local amber = { 1.00, 0.72, 0.20 }
local muted = { 0.55, 0.70, 0.72 }
local pale = { 0.82, 0.91, 0.91 }
local screen

local items = {
    { id = "data_reel", name = "DE-GAUSSED DATA REEL", x = 130, y = 225,
      detail = "Magnetic recording tape from the primary borehole hydrophone array." },
    { id = "dial_knob", name = "EMERGENCY TUNER DIAL", x = 315, y = 225,
      detail = "Precision potentiometer knob. Essential to calibrate the receiver frequency." },
    { id = "bio_keycard", name = "BIO-SAFETY PASS", x = 500, y = 225,
      detail = "Dr. Thorne's access badge, coated in a faint iridescent powder." },
    { id = "vacuum_tube", name = "THERMIONIC VACUUM TUBE", x = 130, y = 355,
      detail = "High-frequency amplifier valve. Needed to boost the carrier wave." },
    { id = "diary_fragment", name = "DR. THORNE'S NOTES", x = 315, y = 355,
      detail = "Field notes: carrier 84.7 kHz, modulation 65%; vault code 5729." },
    { id = "dosimeter", name = "EMF DOSIMETER", x = 500, y = 355,
      detail = "Analog field counter. Its needle trembles toward the maximum scale." },
}

local logs = {
    log_01_briefing = {
        title = "DIRECTIVE: DEEP HORIZON // OCT 1983",
        body = "STATION ECHO-7 STATUS: Commissioned for deep seismic acoustic telemetry.\n\nPrimary mandate: listen to low-frequency anomalous harmonic pulses emanating from borehole shaft 9. Strict quarantine protocol in effect. All surface elevators locked until review.",
    },
    log_02_containment = {
        title = "INCIDENT LOG: SUB-LEVEL BREACH",
        body = 'The array picked up a modulated waveform at 84.7 kHz. It is NOT seismic.\n\nFive minutes after lock, the communications lab terminal began printing unsolicited transmissions. Dr. Thorne refused to cut receiver power. He claims the signal is "responding to our heartbeats".\n\nEmergency circuit breaker tripped in the Airlock.',
    },
    log_03_thorne_notes = {
        title = "DR. THORNE'S FIELD SCRAP",
        body = "The telemetry antennas are pointing 4,000 meters STRAIGHT DOWN into the permafrost core.\n\nThe carrier wave is resonant at 84.7 kHz with 65% harmonic modulation. The isolation vault lock sequence is tied to station coordinates: Core [5], Array [7], Bio-Pass [2], Vault [9].",
    },
    log_04_intercept = {
        title = "DECODED TRANSMISSION ECHO",
        body = '>>> CARRIER SYNCHRONIZED <<<\n\n"WE DO NOT COME FROM ABOVE. WE HAVE BEEN ASLEEP UNDER YOUR CONTINENT FOR THREE HUNDRED MILLION YEARS. YOUR DRILL AWAKENED THE NERVE ENDINGS."\n\nEMERGENCY OVERRIDE CODE FOR SUB-VAULT 9: 5 - 7 - 2 - 9.',
    },
    log_05_vault_revelation = {
        title = "BLACK BOX: VAULT INTERIOR",
        body = "If someone from the surface is listening... do not send rescue teams.\n\nThe object in Vault 9 is not a meteor or inactive artifact. It is a dormant neural node of a planetary organism. Our radio signals acted like an alarm bell.\n\nIt has connected to our relay. It is using our antennas to broadcast outside... It is calling the rest of them.",
    },
}

local state = {
    scene = "title",
    power = false,
    airlock = false,
    found = {},
    scopeSolved = false,
    keypadSolved = false,
    completed = false,
    discovered = { log_01_briefing = true },
    frequency = 74.2,
    modulation = 22,
    startedAt = os.time(),
    elapsed = 0,
}

local function foundCount()
    local count = 0
    for _, item in ipairs(items) do
        if state.found[item.id] then count = count + 1 end
    end
    return count
end

local function discover(id)
    if logs[id] then state.discovered[id] = true end
end

local function saveGame()
    state.elapsed = state.elapsed + math.max(0, os.time() - state.startedAt)
    state.startedAt = os.time()
    local path = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
    local file, err = io.open(path, "w")
    if not file then
        print("Could not save investigation: " .. tostring(err))
        return false
    end
    file:write(json.encode(state))
    file:close()
    return true
end

local function loadGame()
    local path = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
    local file = io.open(path, "r")
    if not file then return false end
    local contents = file:read("*a")
    file:close()
    local ok, saved = pcall(json.decode, contents)
    if not ok or type(saved) ~= "table" or type(saved.found) ~= "table"
        or type(saved.discovered) ~= "table" then
        print("Saved investigation could not be read.")
        return false
    end
    for key, value in pairs(saved) do state[key] = value end
    state.startedAt = os.time()
    return true
end

local function clearScreen()
    if screen then
        screen:removeSelf()
        screen = nil
    end
    screen = display.newGroup()
end

local function box(x, y, width, height, color, alpha, parent)
    local shape = display.newRoundedRect(parent or screen, x, y, width, height, 6)
    shape:setFillColor(color[1], color[2], color[3], alpha or 1)
    return shape
end

local function line(x1, y1, x2, y2, color, width, alpha, parent)
    local shape = display.newLine(parent or screen, x1, y1, x2, y2)
    shape:setStrokeColor(color[1], color[2], color[3], alpha or 1)
    shape.strokeWidth = width or 1
    return shape
end

local function text(value, x, y, size, color, width, parent, align)
    local options = {
        parent = parent or screen,
        text = value,
        x = x,
        y = y,
        font = native.systemFont,
        fontSize = size or 16,
        align = align or "center",
    }
    if width then options.width = width end
    local object = display.newText(options)
    if align == "left" then object.anchorX = 0 end
    object:setFillColor(color[1], color[2], color[3])
    return object
end

local function button(x, y, width, height, caption, callback, color, size, parent)
    local group = display.newGroup()
    local container = parent or screen
    container:insert(group)
    local fill = color or green
    local bg = box(x, y, width, height, { 0.05, 0.12, 0.12 }, 0.98, group)
    bg.strokeWidth = 1.5
    bg:setStrokeColor(fill[1], fill[2], fill[3], 0.8)
    local label = text(caption, x, y, size or 14, fill, width - 12, group)
    label.height = math.min(height - 6, label.height)
    bg:addEventListener("tap", function()
        if callback then callback() end
        return true
    end)
    return group
end

local function background(title)
    box(W / 2, H / 2, W, H, { 0.025, 0.045, 0.055 })
    for x = 0, W, 48 do line(x, 76, x, H, { 0.12, 0.21, 0.22 }, 1, 0.35) end
    for y = 92, H, 48 do line(0, y, W, y, { 0.12, 0.21, 0.22 }, 1, 0.25) end
    box(W / 2, 39, W, 78, { 0.025, 0.07, 0.075 }, 1)
    line(0, 78, W, 78, green, 1, 0.65)
    text("STATION ECHO-7 // " .. string.upper(title), 20, 22, 16, green, 550, nil, "left")
    if state.scene == "title" then return end
    local objective
    if not state.power then
        objective = "RESTORE AUXILIARY POWER IN THE AIRLOCK"
    elseif not state.airlock then
        objective = "ACCESS THE SECURITY TERMINAL AND RELEASE THE SEAL"
    elseif foundCount() < #items then
        objective = "RECOVER THE MISSING LAB COMPONENTS (" .. foundCount() .. "/6)"
    elseif not state.scopeSolved then
        objective = "ALIGN THE CARRIER WAVE: 84.7 kHz / 65%"
    elseif not state.keypadSolved then
        objective = "ENTER THE OVERRIDE CODE AT SUB-VAULT 9"
    elseif not state.completed then
        objective = "ENTER THE VAULT AND PLAY THE FINAL TRANSMISSION"
    else
        objective = "CHAPTER 1 COMPLETE // REVIEW THE ARCHIVE"
    end
    text(objective, 20, 54, 12, amber, 570, nil, "left")
    button(676, 39, 82, 34, "LOGS", function()
        if state.scene ~= "title" then
            local available = {}
            for id, _ in pairs(state.discovered) do
                if logs[id] then table.insert(available, id) end
            end
            table.sort(available)
            showArchive(available)
        end
    end, muted, 13)
    button(770, 39, 94, 34, "INVENTORY", function()
        if state.scene ~= "title" then showInventory() end
    end, muted, 12)
    button(876, 39, 68, 34, "SAVE", function()
        if saveGame() then
            showMessage("FIELD NOTES SAVED", "Investigation progress archived to this device.")
        else
            showMessage("SAVE FAILED", "Progress could not be written to this device.")
        end
    end, muted, 12)
end

local function closeOverlay(overlay)
    if overlay then overlay:removeSelf() end
end

function showMessage(title, message, onClose)
    local overlay = display.newGroup()
    screen:insert(overlay)
    local blocker = display.newRect(overlay, W / 2, H / 2, W, H)
    blocker:setFillColor(0, 0, 0, 0.78)
    blocker:addEventListener("tap", function() return true end)
    box(W / 2, H / 2, 730, 390, { 0.035, 0.085, 0.09 }, 1, overlay)
    local frame = display.newRoundedRect(overlay, W / 2, H / 2, 730, 390, 8)
    frame:setFillColor(0, 0, 0, 0)
    frame.strokeWidth = 2
    frame:setStrokeColor(green[1], green[2], green[3], 0.9)
    text(title, W / 2, 170, 20, amber, 650, overlay)
    text(message, W / 2 - 300, 205, 16, pale, 600, overlay, "left")
    button(W / 2, 455, 190, 42, "CONTINUE", function()
        closeOverlay(overlay)
        if onClose then onClose() end
    end, green, 15, overlay)
end

function showArchive(available)
    local overlay = display.newGroup()
    screen:insert(overlay)
    local blocker = display.newRect(overlay, W / 2, H / 2, W, H)
    blocker:setFillColor(0, 0, 0, 0.82)
    blocker:addEventListener("tap", function() return true end)
    box(W / 2, H / 2, 690, 480, { 0.035, 0.085, 0.09 }, 1, overlay)
    text("RECOVERED TRANSMISSIONS", W / 2, 105, 20, amber, 640, overlay)
    if #available == 0 then
        text("NO LOGS RECOVERED", W / 2, 270, 17, muted, 500, overlay)
    else
        for index, id in ipairs(available) do
            local entry = logs[id]
            button(W / 2, 155 + (index - 1) * 55, 570, 43, entry.title, function()
                closeOverlay(overlay)
                showMessage(entry.title, entry.body)
            end, green, 13, overlay)
        end
    end
    button(W / 2, 505, 150, 38, "CLOSE", function() closeOverlay(overlay) end, muted, 13, overlay)
end

function showInventory()
    local collected = {}
    for _, item in ipairs(items) do
        if state.found[item.id] then table.insert(collected, item.name .. "\n" .. item.detail) end
    end
    showMessage("FIELD INVENTORY (" .. #collected .. "/6)", #collected > 0 and table.concat(collected, "\n\n") or "No equipment recovered yet.")
end

function drawTitle()
    clearScreen()
    state.scene = "title"
    background("CLASSIFIED TRANSMISSION")
    text("THE ALIEN CONNECTION", W / 2, 160, 38, green, 850)
    text("AN ANALOG HORROR & MYSTERY ADVENTURE", W / 2, 205, 17, muted, 850)
    text("OCTOBER 1983 // 4,000 METERS BELOW THE PERMAFROST", W / 2, 275, 16, amber, 800)
    text("Station Echo-7 has locked onto a persistent 84.7 kHz signal.", W / 2, 315, 17, pale, 820)
    text("You are the sole field engineer sent to investigate the blackout.", W / 2, 345, 17, pale, 820)
    text("The antennas were never pointed at the sky.", W / 2, 390, 18, green, 820)
    button(W / 2, 475, 330, 54, "BEGIN INVESTIGATION", function()
        local path = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
        os.remove(path)
        state = {
            scene = "airlock", power = false, airlock = false, found = {},
            scopeSolved = false, keypadSolved = false, completed = false,
            discovered = { log_01_briefing = true }, frequency = 74.2,
            modulation = 22, startedAt = os.time(), elapsed = 0,
        }
        drawAirlock()
    end, green, 17)
    local savePath = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
    local saveFile = io.open(savePath, "r")
    if saveFile then
        saveFile:close()
        button(W / 2, 540, 330, 46, "RESUME INVESTIGATION", function()
            if loadGame() then drawScene(state.scene) else drawTitle() end
        end, amber, 15)
    end
    text("TOUCH OBJECTS AND CONTROLS TO INVESTIGATE", W / 2, 605, 12, muted, 800)
end

function drawAirlock()
    clearScreen()
    state.scene = "airlock"
    background("AIRLOCK MONITORING ANTECHAMBER")
    text("AUX POWER BREAKER", 165, 165, 14, amber, 240)
    box(165, 300, 150, 220, { 0.09, 0.15, 0.17 })
    box(165, 215, 120, 10, { 0.65, 0.39, 0.07 })
    text(state.power and "POWER ONLINE" or "TRIPPED / OFFLINE", 165, 245, 13, state.power and green or { 1, 0.3, 0.28 }, 145)
    box(165, state.power and 340 or 390, 50, 80, state.power and green or { 0.7, 0.18, 0.16 })
    button(165, 450, 180, 42, state.power and "RELAY ENGAGED" or "RESET BREAKER", function()
        state.power = true
        drawAirlock()
        showMessage("AUXILIARY POWER ONLINE", "The magnetic relay catches. Cooling fans and terminal displays begin to hum.")
        saveGame()
    end, state.power and muted or green, 13)

    text("SECURITY TERMINAL", 470, 165, 14, amber, 260)
    box(470, 285, 230, 160, { 0.11, 0.17, 0.19 })
    box(470, 275, 190, 92, state.power and { 0.02, 0.13, 0.09 } or { 0.015, 0.025, 0.03 })
    text(state.power and "ECHO-7  //  LINK ACTIVE" or "NO POWER", 470, 265, 13, state.power and green or muted, 180)
    button(470, 390, 200, 42, "ACCESS TERMINAL", function()
        if not state.power then
            showMessage("TERMINAL OFFLINE", "Restore auxiliary power at the breaker first.")
        else
            discover("log_02_containment")
            showMessage(logs.log_02_containment.title, logs.log_02_containment.body, function()
                state.airlock = true
                saveGame()
                drawAirlock()
                showMessage("QUARANTINE RELEASED", "The pneumatic seals disengage. The communications lab door is open.")
            end)
        end
    end, green, 13)

    text("SECTOR 4 // COMMUNICATIONS LAB", 770, 165, 14, amber, 290)
    box(770, 310, 190, 290, { 0.08, 0.13, 0.15 })
    line(770, 175, 770, 445, { 0.18, 0.28, 0.3 }, 3)
    text(state.airlock and "SEAL RELEASED" or "QUARANTINE SEAL", 770, 220, 13, state.airlock and green or { 1, 0.3, 0.28 }, 170)
    button(770, 405, 190, 48, state.airlock and "ENTER LAB" or "DISENGAGE SEALS", function()
        if not state.power then
            showMessage("BLAST DOOR LOCKED", "Auxiliary power is required to disengage the pneumatic clamps.")
        elseif not state.airlock then
            state.airlock = true
            saveGame()
            drawAirlock()
            showMessage("QUARANTINE RELEASED", "The pneumatic seals hiss open. Static spills from the communications lab.")
        else
            drawLab()
        end
    end, green, 13)
end

function drawLab()
    clearScreen()
    state.scene = "lab"
    background("COMMUNICATIONS LAB & ARCHIVE")
    text("RECOVERY CHECKLIST", 770, 115, 15, amber, 300)
    for index, item in ipairs(items) do
        local mark = state.found[item.id] and "[X] " or "[ ] "
        text(mark .. item.name, 615, 145 + (index - 1) * 31, 11, state.found[item.id] and green or muted, 340, nil, "left")
    end
    text("TAP THE GLOWING OBJECTS TO RECOVER THEM", 340, 125, 13, muted, 610)
    for _, item in ipairs(items) do
        local isFound = state.found[item.id]
        box(item.x, item.y, 150, 82, isFound and { 0.04, 0.13, 0.09 } or { 0.08, 0.16, 0.16 })
        local indicator = display.newCircle(screen, item.x, item.y - 13, 15)
        indicator:setFillColor(green[1], green[2], green[3], isFound and 0.25 or 0.85)
        text(isFound and "RECOVERED" or "?", item.x, item.y - 13, 13, isFound and green or { 0.02, 0.07, 0.05 }, 34)
        text(item.name, item.x, item.y + 23, 10, isFound and muted or pale, 140)
        if not isFound then
            local hit = display.newRect(screen, item.x, item.y, 160, 92)
            hit:setFillColor(0, 0, 0, 0.01)
            hit:addEventListener("tap", function()
                state.found[item.id] = true
                if item.id == "diary_fragment" then discover("log_03_thorne_notes") end
                local allFound = foundCount() == #items
                saveGame()
                drawLab()
                if allFound then
                    showMessage("ALL COMPONENTS RECOVERED", "The receiver's tuner dial and amplifier tube are ready. The borehole signal can now be calibrated.")
                else
                    showMessage("ITEM RECOVERED: " .. item.name, item.detail)
                end
                return true
            end)
        end
    end
    box(675, 365, 190, 170, { 0.08, 0.13, 0.15 })
    text("SIGNAL RECEIVER 03", 675, 310, 13, amber, 220)
    text(state.scopeSolved and "CARRIER SYNCHRONIZED" or (foundCount() == 6 and "CALIBRATION READY" or "MISSING COMPONENTS"), 675, 344, 11, state.scopeSolved and green or muted, 210)
    button(675, 410, 180, 42, "OPEN OSCILLOSCOPE", function()
        if foundCount() < 6 then showMessage("RECEIVER INCOMPLETE", "Recover all six components listed in the checklist.")
        else drawScope() end
    end, green, 12)
    button(675, 465, 180, 42, "SUB-VAULT 9 KEYPAD", function()
        if state.scopeSolved then drawKeypad()
        else showMessage("VAULT ACCESS DENIED", "Decode the carrier signal before attempting the isolation lock.") end
    end, state.scopeSolved and amber or muted, 11)
    button(100, 565, 155, 40, "< AIRLOCK", drawAirlock, muted, 13)
end

function drawScope()
    clearScreen()
    state.scene = "scope"
    background("SIGNAL RECEIVER // OSCILLOSCOPE NODE 3")
    box(295, 300, 500, 350, { 0.025, 0.085, 0.07 })
    for x = 70, 520, 45 do line(x, 150, x, 450, { 0.12, 0.34, 0.24 }, 1, 0.65) end
    for y = 160, 445, 35 do line(70, y, 520, y, { 0.12, 0.34, 0.24 }, 1, 0.65) end
    line(70, 300, 520, 300, green, 1, 0.45)
    local freqOffset = math.abs(state.frequency - 84.7)
    local harmOffset = math.abs(state.modulation - 65)
    for x = 75, 515, 5 do
        local t = (x - 75) / 440
        local y = 300 + math.sin(t * (state.frequency / 3) + os.time() % 10) * 68
        local trace = display.newCircle(screen, x, y, 2)
        trace:setFillColor(green[1], green[2], green[3], 0.9)
    end
    text("MODEL 83-E // BOREHOLE ACOUSTIC SENSOR ARRAY", 295, 125, 14, green, 500)
    box(730, 270, 310, 280, { 0.055, 0.09, 0.1 })
    text("CARRIER FREQUENCY", 730, 160, 14, amber, 280)
    text(string.format("%.1f kHz", state.frequency), 730, 195, 25, green, 280)
    button(650, 235, 70, 38, "-5", function() state.frequency = math.max(70, state.frequency - 5); drawScope() end, muted, 14)
    button(730, 235, 70, 38, "-0.5", function() state.frequency = math.max(70, math.floor((state.frequency - 0.5) * 10 + 0.5) / 10); drawScope() end, muted, 13)
    button(810, 235, 70, 38, "+0.5", function() state.frequency = math.min(100, math.floor((state.frequency + 0.5) * 10 + 0.5) / 10); drawScope() end, muted, 13)
    button(890, 235, 70, 38, "+5", function() state.frequency = math.min(100, state.frequency + 5); drawScope() end, muted, 14)
    button(690, 283, 100, 38, "FINE -0.1", function() state.frequency = math.max(70, math.floor((state.frequency - 0.1) * 10 + 0.5) / 10); drawScope() end, muted, 11)
    text("HARMONIC MODULATION: " .. state.modulation .. "%", 730, 340, 14, amber, 280)
    button(650, 390, 90, 38, "-10%", function() state.modulation = math.max(0, state.modulation - 10); drawScope() end, muted, 13)
    button(750, 390, 90, 38, "-1%", function() state.modulation = math.max(0, state.modulation - 1); drawScope() end, muted, 13)
    button(850, 390, 90, 38, "+1%", function() state.modulation = math.min(100, state.modulation + 1); drawScope() end, muted, 13)
    button(750, 438, 90, 38, "+10%", function() state.modulation = math.min(100, state.modulation + 10); drawScope() end, muted, 13)
    button(850, 283, 100, 38, "FINE +0.1", function() state.frequency = math.min(100, math.floor((state.frequency + 0.1) * 10 + 0.5) / 10); drawScope() end, muted, 11)
    local aligned = freqOffset <= 0.3 and harmOffset <= 3
    text(state.scopeSolved and "CARRIER SYNCHRONIZED" or (aligned and "SIGNAL IN RANGE" or "CARRIER UNLOCKED"),
        295, 495, 16, (state.scopeSolved or aligned) and green or { 1, 0.35, 0.3 }, 500)
    text("Dr. Thorne's notes: target 84.7 kHz / 65%", 295, 530, 13, muted, 500)
    button(770, 510, 250, 45, state.scopeSolved and "SIGNAL DECODED" or "ENGAGE CARRIER LOCK", function()
        if math.abs(state.frequency - 84.7) <= 0.3 and math.abs(state.modulation - 65) <= 3 then
            state.scopeSolved = true
            discover("log_04_intercept")
            saveGame()
            drawScope()
            showMessage(logs.log_04_intercept.title, logs.log_04_intercept.body)
        else
            showMessage("SIGNAL OUT OF ALIGNMENT", "Target: 84.7 kHz carrier frequency and 65% harmonic modulation.")
        end
    end, green, 12)
    button(105, 565, 160, 40, "< RETURN TO LAB", drawLab, muted, 12)
end

function drawKeypad()
    clearScreen()
    state.scene = "keypad"
    background("SUB-VAULT 9 ISOLATION LOCK")
    box(W / 2, 350, 420, 470, { 0.055, 0.09, 0.1 })
    text("PNEUMATIC SEAL OVERRIDE", W / 2, 150, 16, amber, 380)
    local entry = state.enteredCode or ""
    text(state.keypadSolved and "5  7  2  9" or (entry .. string.rep(" _", 4 - #entry)), W / 2, 205, 30, green, 360)
    text(state.keypadSolved and "ACCESS AUTHORIZED" or "ENTER 4-DIGIT FACILITY CODE", W / 2, 245, 13, state.keypadSolved and green or muted, 360)
    local digits = { "1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "ENT" }
    for index, digit in ipairs(digits) do
        local row = math.floor((index - 1) / 3)
        local col = (index - 1) % 3
        button(370 + col * 110, 305 + row * 60, 90, 48, digit, function()
            if state.keypadSolved then return end
            if digit == "CLR" then
                state.enteredCode = ""
            elseif digit == "ENT" then
                if (state.enteredCode or "") == "5729" then
                    state.keypadSolved = true
                    saveGame()
                    drawKeypad()
                    showMessage("ACCESS GRANTED", "Code accepted: 5 - 7 - 2 - 9. The Sub-Vault 9 isolation doors retract.")
                else
                    state.enteredCode = ""
                    drawKeypad()
                    showMessage("ACCESS DENIED", "Incorrect sequence. Review the decoded transmission and Dr. Thorne's notes.")
                end
                return
            elseif #entry < 4 then
                state.enteredCode = entry .. digit
            end
            drawKeypad()
        end, digit == "ENT" and green or muted, 15)
    end
    if state.keypadSolved then
        button(W / 2, 565, 260, 42, "ENTER THE VAULT", drawVault, green, 15)
    else
        button(W / 2, 565, 150, 40, "< RETURN TO LAB", drawLab, muted, 12)
    end
end

function drawVault()
    clearScreen()
    state.scene = "vault"
    background("SUB-VAULT 9 // BOREHOLE CHAMBER")
    box(W / 2, 350, 360, 390, { 0.015, 0.04, 0.04 })
    local aura = display.newCircle(screen, W / 2, 325, 120)
    aura:setFillColor(0.08, 0.85, 0.58, 0.17)
    local monolith = display.newPolygon(screen, W / 2, 320, { 0, -115, 55, -30, 43, 95, -43, 95, -55, -30 })
    monolith:setFillColor(0.035, 0.065, 0.07)
    monolith.strokeWidth = 2
    monolith:setStrokeColor(green[1], green[2], green[3], 0.8)
    monolith:addEventListener("tap", function()
        showMessage("SUB-VAULT 9 ANOMALY", "A suspended neural node pulses with the same 84.7 kHz rhythm. It is woven directly into the station's broadcast transmitters.")
        return true
    end)
    text("CONTAINMENT SHAFT // SIGNAL 84.7 kHz", W / 2, 155, 15, amber, 700)
    text("DR. THORNE BLACK BOX TERMINAL", W / 2, 500, 15, amber, 420)
    button(W / 2, 550, 370, 45, state.completed and "TRANSMISSION ARCHIVED" or "PLAY FINAL TRANSMISSION", function()
        if not state.completed then
            state.completed = true
            discover("log_05_vault_revelation")
            saveGame()
            drawVault()
            showMessage(logs.log_05_vault_revelation.title, logs.log_05_vault_revelation.body, function()
                showEnding()
            end)
        else
            showEnding()
        end
    end, green, 14)
end

function showEnding()
    local elapsed = state.elapsed + math.max(0, os.time() - state.startedAt)
    local minutes = math.floor(elapsed / 60)
    local seconds = elapsed % 60
    showMessage("CHAPTER 1 INVESTIGATION COMPLETE",
        "CASE FILE: STATION ECHO-7\n\nFACILITY POWER: RESTORED\nCOMPONENTS: " .. foundCount() .. " / 6\nCARRIER LOCK: 84.7 kHz / 65%\nSUB-VAULT CODE: 5729\nLOGS RECOVERED: " .. (function()
            local count = 0
            for _ in pairs(state.discovered) do count = count + 1 end
            return count
        end)() .. " / 5\nTIME ELAPSED: " .. minutes .. "m " .. string.format("%02d", seconds) .. "s\n\nANOMALY: AWAKENED PLANETARY NEURAL NODE\nBROADCAST STATUS: TRANSMITTING...",
        function()
            button(W / 2, 520, 230, 42, "RESTART INVESTIGATION", function()
                local path = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
                os.remove(path)
                drawTitle()
            end, amber, 13)
        end)
end

function drawScene(sceneName)
    if sceneName == "airlock" then return drawAirlock() end
    if sceneName == "lab" then return drawLab() end
    if sceneName == "scope" then return drawScope() end
    if sceneName == "keypad" then return drawKeypad() end
    if sceneName == "vault" then return drawVault() end
    return drawAirlock()
end

drawTitle()
