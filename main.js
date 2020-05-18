// util
function debounce(func, time, context) {
    let timeoutId
    return function() {
        clearTimeout(timeoutId)
        const args = arguments
        timeoutId = setTimeout(function() { func.apply(context, args) }, time)
    }
}
function doEachAnimationFrame(func, context) {
    const wrappedFunc = () => {
        func.call(context)
        requestAnimationFrame(wrappedFunc)
    }
    requestAnimationFrame(wrappedFunc)
}
function lerp(a, b, t) {
    return a + t * (b - a)
}
function ilerp(x, a, b) {
    return (x - a) / (b - a)
}

// config
const DRAWING_POST_URL = 'http://localhost:8000/drawing'

// callout banner color anim
function doLetters(letters) {
    letters.forEach(letter => {
        letter.style.transform = `translateX(${lerp(-1.5, 1.5, Math.random())}%) translateY(${lerp(-2.5, 2.5, Math.random())}%) rotate(${lerp(-9, 9, Math.random())}deg)`
        letter.style.setProperty('--color-angle', `${lerp(0, 360, Math.random())}deg`)
        letter.style.backgroundPosition = `${lerp(-100, 100, Math.random())}% ${lerp(-100, 100, Math.random())}%`
    })
}
document.querySelectorAll('.callout').forEach(callout => {
    const letters = callout.querySelectorAll('.title span')
    let intervalId = 0
    callout.addEventListener('mouseenter', e => {
        intervalId = setInterval(() => doLetters(letters), 450)
        doLetters(letters)
    })
    callout.addEventListener('mouseleave', e => {
        clearInterval(intervalId)
        letters.forEach(letter => letter.style.transform = ``)
    })
})

// main
const canvas = new fabric.Canvas('canvas', {
    isDrawingMode: true,
})
canvas.wrapperEl.classList.add('wave-border')
canvas.wrapperEl.style.setProperty('--wave-border-x', 3 + 'px')
canvas.wrapperEl.style.setProperty('--wave-border-y', 104 + 'px')

// resizing
let prevCanvasWidth = 0
let prevCanvasHeight = 0
doEachAnimationFrame(() => {
    if (canvas.wrapperEl.clientWidth != prevCanvasWidth || canvas.wrapperEl.clientHeight != prevCanvasHeight) {
        canvas.setWidth(canvas.wrapperEl.clientWidth)
        canvas.setHeight(canvas.wrapperEl.clientHeight)
        canvas.renderAll()
        prevCanvasWidth = canvas.wrapperEl.clientWidth
        prevCanvasHeight = canvas.wrapperEl.clientHeight
    }
})

// name
const nameInput = document.querySelector('input[name="full-name"]')
nameInput.value = localStorage.getItem('DRAW-name') || ''
nameInput.addEventListener('input', (e) => localStorage.setItem('DRAW-name', nameInput.value.toString()))

// color controls
function setColor(colorPicker, colorButtons) {
    const currentIndex = colorButtons.indexOf(colorPicker)
    localStorage.setItem('DRAW-colorIndex', currentIndex)
    // unset old
    for (let button of colorButtons) {
        button.classList.remove('selected')
    }
    // set color
    colorPicker.classList.add('selected')
    const color = colorPicker.dataset.color
    canvas.freeDrawingBrush.color = color
    document.querySelector('.draw-panel').style.backgroundColor = color
}

function setupColors(initialColorIndex) {
    const colorButtons = Array.from(document.querySelectorAll('.colors > div'))
    for (let button of colorButtons) {
        button.style.backgroundColor = button.dataset.color
        button.onclick = function(e) { setColor(button, colorButtons) }
    }
    setColor(colorButtons[initialColorIndex || 8], colorButtons)
}
setupColors(parseInt(localStorage.getItem('DRAW-colorIndex') || 8))

// width controls
const widthButtons = Array.from(document.querySelectorAll('.width'))
function setWidth(widthButton) {
    localStorage.setItem('DRAW-widthIndex', widthButtons.indexOf(widthButton))
    for (let button of widthButtons) {
        button.classList.remove('selected')
    }
    widthButton.classList.add('selected')
    canvas.freeDrawingBrush.width = parseFloat(widthButton.dataset.size)
}
for (let button of widthButtons) {
    button.onclick = function(e) { setWidth(e.target) }
}
setWidth(widthButtons[parseInt(localStorage.getItem('DRAW-widthIndex') || 1)])

// drawing history
let history = []
let historyIndex = 0
let doingHistory = false
let justCleared = false
function redrawUpToHistory(index) {
    justCleared = false
    canvas.clear()
    doingHistory = true
    for (let i = 0; i < index && i < history.length; i++) {
        canvas.add(history[i])
    }
    doingHistory = false
    canvas.renderAll()
}

// handle when new path is drawn
canvas.on('object:added', function(e) {
    if (doingHistory) return

    justCleared = false
    if (historyIndex < history.length) {
        history = history.slice(0, historyIndex)
    }
    history.push(e.target)
    historyIndex++

    // reset submitted state
    submitState = SUBMIT_STATE.NONE

    // save drawing
    localStorage.setItem('DRAW-drawing', JSON.stringify(canvas.toObject()))
})

// load drawing after page load
document.addEventListener('DOMContentLoaded', e => {
    canvas.loadFromJSON(JSON.parse(localStorage.getItem('DRAW-drawing')), function() {
        canvas.renderAll()
    })
})

// drawing controls
const undoButton = document.querySelector('.undo')
const redoButton = document.querySelector('.redo')
const clearButton = document.querySelector('.clear')

undoButton.onclick = function(e) {
    if (justCleared) {
        historyIndex = history.length
        redrawUpToHistory(historyIndex, true)
    } else if (historyIndex > 0) {
        historyIndex = Math.max(historyIndex - 1, 0)
        redrawUpToHistory(historyIndex, true)
    }
}
redoButton.onclick = function(e) {
    if (justCleared) {
        historyIndex = history.length
        redrawUpToHistory(historyIndex, true)
    } else if (historyIndex < history.length) {
        historyIndex = Math.min(historyIndex + 1, history.length)
        redrawUpToHistory(historyIndex, true)
    }
}
clearButton.onclick = function(e) {
    if (historyIndex > 0) {
        historyIndex = 0
        redrawUpToHistory(historyIndex, true)
        justCleared = true
        // flash canvas red
        const canvasContainer = document.querySelector('.canvas-container')
        const prevTransition = canvasContainer.style.transition
        const prevColor = canvasContainer.style.backgroundColor
        canvasContainer.style.transition = 'none'
        canvasContainer.style.backgroundColor = '#ff5151'
        setTimeout(() => {
            canvasContainer.style.transition = prevTransition
            canvasContainer.style.backgroundColor = prevColor
        }, 0)
    }
}

doEachAnimationFrame(() => {
    undoButton.classList.toggle('disabled', !justCleared && historyIndex <= 0 && canvas.isDrawingMode)
    redoButton.classList.toggle('disabled', !justCleared && historyIndex >= history.length && canvas.isDrawingMode)
    clearButton.classList.toggle('disabled', canvas._objects.length == 0 && canvas.isDrawingMode)
})

// drawing submit
const SUBMIT_STATE = {
    NONE: 'NONE',
    INPROGRESS: 'INPROGRESS',
    FAILED: 'FAILED',
    DONE: 'DONE',
}
let submitState = SUBMIT_STATE.NONE
function submitDrawing() {
    submitState = SUBMIT_STATE.INPROGRESS
    // calculate and cache bounds
    const group = new fabric.Group(canvas.getObjects(), null, true)
    group._calcBounds()
    const bounds = {
        left: group.left,
        top: group.top,
        width: group.width,
        height: group.height,
    }
    // reset objects to center
    group.setPositionByOrigin({x: 0, y: 0})
    // get data and shift objects to top-left based on bounds
    const data = canvas.toObject()
    data.objects.forEach(function(obj) {
        obj.left = obj.left - bounds.left
        obj.top = obj.top - bounds.top
    })
    // post data and dimensions
    fetch(DRAWING_POST_URL, {
        method: 'post',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            name: nameInput.value || '',
            json: data,
            dimensions: { width: Math.ceil(bounds.width), height: Math.ceil(bounds.height) },
        })
    }).then(res => {
        if (res.ok) {
        submitState = SUBMIT_STATE.DONE
        } else {
            throw res.statusText
        }
    }).catch(err => {
        submitState = SUBMIT_STATE.FAILED
    })
}

// submit buttons and drawing ability based on submit state
const submitButtons = {
    [SUBMIT_STATE.NONE]: document.querySelector('.submit-none'),
    [SUBMIT_STATE.INPROGRESS]: document.querySelector('.submit-inprogress'),
    [SUBMIT_STATE.FAILED]: document.querySelector('.submit-failed'),
    [SUBMIT_STATE.DONE]: document.querySelector('.submit-done'),
}
const submitButtonsAll = Object.values(submitButtons)
doEachAnimationFrame(() => {
    submitButtonsAll.forEach(b => b.style.display = 'none')
    submitButtons[submitState].style.display = null
    canvas.wrapperEl.classList.toggle('disable-draw', submitState === SUBMIT_STATE.INPROGRESS)
})
