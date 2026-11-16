display.setStatusBar(display.HiddenStatusBar)
display.setDefault("background", 0.02, 0.04, 0.05)

local json = require("json")
local W, H = 360, 800
local green = { 0.20, 1.00, 0.53 }
local amber = { 1.00, 0.72, 0.20 }
local muted = { 0.55, 0.70, 0.72 }
local pale = { 0.82, 0.91, 0.91 }
local screen

local items = {
    { id = "data_reel", name = "DE-GAUSSED DATA REEL", x = 95, y = 230,
      detail = "Magnetic recording tape from the primary borehole hydrophone array." },
    { id = "dial_knob", name = "EMERGENCY TUNER DIAL", x = 265, y = 230,
      detail = "Precision potentiometer knob. Essential to calibrate the receiver frequency." },
    { id = "bio_keycard", name = "BIO-SAFETY PASS", x = 95, y = 330,
      detail = "Dr. Thorne's access badge, coated in a faint iridescent powder." },
    { id = "vacuum_tube", name = "THERMIONIC VACUUM TUBE", x = 265, y = 330,
      detail = "High-frequency amplifier valve. Needed to boost the carrier wave." },
    { id = "diary_fragment", name = "DR. THORNE'S NOTES", x = 95, y = 430,
      detail = "Field notes: carrier 84.7 kHz, modulation 65%; vault code 5729." },
    { id = "dosimeter", name = "EMF DOSIMETER", x = 265, y = 430,
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
    for x = 0, W, 30 do line(x, 112, x, H, { 0.12, 0.21, 0.22 }, 1, 0.35) end
    for y = 120, H, 30 do line(0, y, W, y, { 0.12, 0.21, 0.22 }, 1, 0.25) end
    box(W / 2, 56, W, 112, { 0.025, 0.07, 0.075 }, 1)
    line(0, 112, W, 112, green, 1, 0.65)
    text("STATION ECHO-7 // " .. string.upper(title), 12, 20, 12, green, 336, nil, "left")
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
    text(objective, 12, 46, 10, amber, 336, nil, "left")
    button(60, 86, 104, 32, "LOGS", function()
        if state.scene ~= "title" then
            local available = {}
            for id, _ in pairs(state.discovered) do
                if logs[id] then table.insert(available, id) end
            end
            table.sort(available)
            showArchive(available)
        end
    end, muted, 12)
    button(180, 86, 104, 32, "INVENTORY", function()
        if state.scene ~= "title" then showInventory() end
    end, muted, 12)
    button(300, 86, 104, 32, "SAVE", function()
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
    box(W / 2, H / 2, 320, 560, { 0.035, 0.085, 0.09 }, 1, overlay)
    local frame = display.newRoundedRect(overlay, W / 2, H / 2, 320, 560, 8)
    frame:setFillColor(0, 0, 0, 0)
    frame.strokeWidth = 2
    frame:setStrokeColor(green[1], green[2], green[3], 0.9)
    text(title, W / 2, 170, 17, amber, 280, overlay)
    text(message, 40, 220, 13, pale, 280, overlay, "left")
    button(W / 2, 655, 190, 42, "CONTINUE", function()
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
    box(W / 2, H / 2, 320, 560, { 0.035, 0.085, 0.09 }, 1, overlay)
    text("RECOVERED TRANSMISSIONS", W / 2, 165, 16, amber, 290, overlay)
    if #available == 0 then
        text("NO LOGS RECOVERED", W / 2, 350, 15, muted, 270, overlay)
    else
        for index, id in ipairs(available) do
            local entry = logs[id]
            button(W / 2, 225 + (index - 1) * 58, 280, 46, entry.title, function()
                closeOverlay(overlay)
                showMessage(entry.title, entry.body)
            end, green, 13, overlay)
        end
    end
    button(W / 2, 655, 150, 38, "CLOSE", function() closeOverlay(overlay) end, muted, 13, overlay)
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
    text("THE ALIEN CONNECTION", W / 2, 205, 29, green, 340)
    text("AN ANALOG HORROR & MYSTERY ADVENTURE", W / 2, 248, 12, muted, 340)
    text("OCTOBER 1983 // 4,000 METERS BELOW THE PERMAFROST", W / 2, 320, 13, amber, 330)
    text("Station Echo-7 has locked onto a persistent 84.7 kHz signal.", W / 2, 375, 14, pale, 320)
    text("You are the sole field engineer sent to investigate the blackout.", W / 2, 430, 14, pale, 320)
    text("The antennas were never pointed at the sky.", W / 2, 490, 15, green, 320)
    button(W / 2, 565, 320, 54, "BEGIN INVESTIGATION", function()
        local path = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
        os.remove(path)
        state = {
            scene = "airlock", power = false, airlock = false, found = {},
            scopeSolved = false, keypadSolved = false, completed = false,
            discovered = { log_01_briefing = true }, frequency = 74.2,
            modulation = 22, startedAt = os.time(), elapsed = 0,
        }
        drawAirlock()
    end, green, 16)
    local savePath = system.pathForFile("echo7-save.json", system.DocumentsDirectory)
    local saveFile = io.open(savePath, "r")
    if saveFile then
        saveFile:close()
        button(W / 2, 630, 320, 46, "RESUME INVESTIGATION", function()
            if loadGame() then drawScene(state.scene) else drawTitle() end
        end, amber, 15)
    end
    text("TOUCH OBJECTS AND CONTROLS TO INVESTIGATE", W / 2, 735, 10, muted, 330)
end

function drawAirlock()
    clearScreen()
    state.scene = "airlock"
    background("AIRLOCK MONITORING ANTECHAMBER")
    text("AUXILIARY POWER", W / 2, 145, 14, amber, 320)
    box(W / 2, 220, 310, 120, { 0.09, 0.15, 0.17 })
    box(W / 2, 190, 250, 8, { 0.65, 0.39, 0.07 })
    text(state.power and "POWER ONLINE" or "TRIPPED / OFFLINE", W / 2, 220, 13, state.power and green or { 1, 0.3, 0.28 }, 280)
    box(W / 2, 252, 38, 42, state.power and green or { 0.7, 0.18, 0.16 })
    button(W / 2, 300, 220, 42, state.power and "RELAY ENGAGED" or "RESET BREAKER", function()
        state.power = true
        drawAirlock()
        showMessage("AUXILIARY POWER ONLINE", "The magnetic relay catches. Cooling fans and terminal displays begin to hum.")
        saveGame()
    end, state.power and muted or green, 13)

    text("SECURITY TERMINAL", W / 2, 375, 14, amber, 320)
    box(W / 2, 435, 310, 100, { 0.11, 0.17, 0.19 })
    box(W / 2, 430, 270, 48, state.power and { 0.02, 0.13, 0.09 } or { 0.015, 0.025, 0.03 })
    text(state.power and "ECHO-7  //  LINK ACTIVE" or "NO POWER", W / 2, 430, 12, state.power and green or muted, 250)
    button(W / 2, 500, 220, 42, "ACCESS TERMINAL", function()
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

    text("SECTOR 4 // COMMUNICATIONS LAB", W / 2, 570, 13, amber, 320)
    box(W / 2, 625, 310, 100, { 0.08, 0.13, 0.15 })
    line(32, 590, 32, 660, { 0.18, 0.28, 0.3 }, 3)
    text(state.airlock and "SEAL RELEASED" or "QUARANTINE SEAL", W / 2, 615, 12, state.airlock and green or { 1, 0.3, 0.28 }, 280)
    button(W / 2, 680, 240, 42, state.airlock and "ENTER LAB" or "DISENGAGE SEALS", function()
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
    text("RECOVERY CHECKLIST // TAP TO COLLECT", W / 2, 145, 12, amber, 330)
    for _, item in ipairs(items) do
        local isFound = state.found[item.id]
        box(item.x, item.y, 155, 80, isFound and { 0.04, 0.13, 0.09 } or { 0.08, 0.16, 0.16 })
        local indicator = display.newCircle(screen, item.x, item.y - 12, 14)
        indicator:setFillColor(green[1], green[2], green[3], isFound and 0.25 or 0.85)
        text(isFound and "RECOVERED" or "?", item.x, item.y - 12, 11, isFound and green or { 0.02, 0.07, 0.05 }, 34)
        text(item.name, item.x, item.y + 24, 9, isFound and muted or pale, 145)
        if not isFound then
            local hit = display.newRect(screen, item.x, item.y, 160, 88)
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
    text("SIGNAL RECEIVER 03", W / 2, 505, 13, amber, 320)
    text(state.scopeSolved and "CARRIER SYNCHRONIZED" or (foundCount() == 6 and "CALIBRATION READY" or "MISSING COMPONENTS"), W / 2, 530, 11, state.scopeSolved and green or muted, 320)
    button(W / 2, 575, 240, 42, "OPEN OSCILLOSCOPE", function()
        if foundCount() < 6 then showMessage("RECEIVER INCOMPLETE", "Recover all six components listed in the checklist.")
        else drawScope() end
    end, green, 12)
    button(W / 2, 630, 240, 42, "SUB-VAULT 9 KEYPAD", function()
        if state.scopeSolved then drawKeypad()
        else showMessage("VAULT ACCESS DENIED", "Decode the carrier signal before attempting the isolation lock.") end
    end, state.scopeSolved and amber or muted, 11)
    button(W / 2, 735, 160, 40, "< AIRLOCK", drawAirlock, muted, 12)
end

function drawScope()
    clearScreen()
    state.scene = "scope"
    background("SIGNAL RECEIVER // OSCILLOSCOPE NODE 3")
    box(W / 2, 220, 320, 170, { 0.025, 0.085, 0.07 })
    for x = 30, 330, 30 do line(x, 145, x, 295, { 0.12, 0.34, 0.24 }, 1, 0.65) end
    for y = 150, 290, 28 do line(30, y, 330, y, { 0.12, 0.34, 0.24 }, 1, 0.65) end
    line(30, 220, 330, 220, green, 1, 0.45)
    local freqOffset = math.abs(state.frequency - 84.7)
    local harmOffset = math.abs(state.modulation - 65)
    for x = 32, 328, 4 do
        local t = (x - 32) / 296
        local y = 220 + math.sin(t * (state.frequency / 3) + os.time() % 10) * 48
        local trace = display.newCircle(screen, x, y, 2)
        trace:setFillColor(green[1], green[2], green[3], 0.9)
    end
    text("MODEL 83-E // BOREHOLE SENSOR ARRAY", W / 2, 135, 11, green, 330)
    text("CARRIER FREQUENCY", W / 2, 320, 12, amber, 320)
    text(string.format("%.1f kHz", state.frequency), W / 2, 347, 20, green, 320)
    button(90, 387, 120, 34, "-5 kHz", function() state.frequency = math.max(70, state.frequency - 5); drawScope() end, muted, 12)
    button(270, 387, 120, 34, "-0.5 kHz", function() state.frequency = math.max(70, math.floor((state.frequency - 0.5) * 10 + 0.5) / 10); drawScope() end, muted, 12)
    button(90, 430, 120, 34, "+0.5 kHz", function() state.frequency = math.min(100, math.floor((state.frequency + 0.5) * 10 + 0.5) / 10); drawScope() end, muted, 12)
    button(270, 430, 120, 34, "+5 kHz", function() state.frequency = math.min(100, state.frequency + 5); drawScope() end, muted, 12)
    text("HARMONIC MODULATION: " .. state.modulation .. "%", W / 2, 475, 12, amber, 330)
    button(90, 515, 120, 34, "-10%", function() state.modulation = math.max(0, state.modulation - 10); drawScope() end, muted, 12)
    button(270, 515, 120, 34, "-1%", function() state.modulation = math.max(0, state.modulation - 1); drawScope() end, muted, 12)
    button(90, 558, 120, 34, "+1%", function() state.modulation = math.min(100, state.modulation + 1); drawScope() end, muted, 12)
    button(270, 558, 120, 34, "+10%", function() state.modulation = math.min(100, state.modulation + 10); drawScope() end, muted, 12)
    local aligned = freqOffset <= 0.3 and harmOffset <= 3
    text(state.scopeSolved and "CARRIER SYNCHRONIZED" or (aligned and "SIGNAL IN RANGE" or "CARRIER UNLOCKED"),
        W / 2, 605, 13, (state.scopeSolved or aligned) and green or { 1, 0.35, 0.3 }, 320)
    text("Target: 84.7 kHz / 65%", W / 2, 628, 11, muted, 320)
    button(W / 2, 670, 270, 42, state.scopeSolved and "SIGNAL DECODED" or "ENGAGE CARRIER LOCK", function()
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
    button(W / 2, 740, 180, 40, "< RETURN TO LAB", drawLab, muted, 12)
end

function drawKeypad()
    clearScreen()
    state.scene = "keypad"
    background("SUB-VAULT 9 ISOLATION LOCK")
    box(W / 2, 435, 320, 500, { 0.055, 0.09, 0.1 })
    text("PNEUMATIC SEAL OVERRIDE", W / 2, 155, 14, amber, 320)
    local entry = state.enteredCode or ""
    text(state.keypadSolved and "5  7  2  9" or (entry .. string.rep(" _", 4 - #entry)), W / 2, 195, 26, green, 320)
    text(state.keypadSolved and "ACCESS AUTHORIZED" or "ENTER 4-DIGIT FACILITY CODE", W / 2, 232, 11, state.keypadSolved and green or muted, 320)
    local digits = { "1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "ENT" }
    for index, digit in ipairs(digits) do
        local row = math.floor((index - 1) / 3)
        local col = (index - 1) % 3
        button(90 + col * 90, 310 + row * 58, 76, 46, digit, function()
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
        button(W / 2, 710, 260, 42, "ENTER THE VAULT", drawVault, green, 15)
    else
        button(W / 2, 710, 180, 40, "< RETURN TO LAB", drawLab, muted, 12)
    end
end

function drawVault()
    clearScreen()
    state.scene = "vault"
    background("SUB-VAULT 9 // BOREHOLE CHAMBER")
    box(W / 2, 365, 320, 390, { 0.015, 0.04, 0.04 })
    local aura = display.newCircle(screen, W / 2, 335, 100)
    aura:setFillColor(0.08, 0.85, 0.58, 0.17)
    local monolith = display.newPolygon(screen, W / 2, 335, { 0, -105, 48, -26, 38, 90, -38, 90, -48, -26 })
    monolith:setFillColor(0.035, 0.065, 0.07)
    monolith.strokeWidth = 2
    monolith:setStrokeColor(green[1], green[2], green[3], 0.8)
    monolith:addEventListener("tap", function()
        showMessage("SUB-VAULT 9 ANOMALY", "A suspended neural node pulses with the same 84.7 kHz rhythm. It is woven directly into the station's broadcast transmitters.")
        return true
    end)
    text("CONTAINMENT SHAFT // SIGNAL 84.7 kHz", W / 2, 155, 13, amber, 330)
    text("DR. THORNE BLACK BOX TERMINAL", W / 2, 520, 13, amber, 320)
    button(W / 2, 585, 310, 45, state.completed and "TRANSMISSION ARCHIVED" or "PLAY FINAL TRANSMISSION", function()
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
    end, green, 12)
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
            button(W / 2, 735, 230, 42, "RESTART INVESTIGATION", function()
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
