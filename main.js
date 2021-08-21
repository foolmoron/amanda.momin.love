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

// catch all errors
window.onerror = function(...args) {
    alert(`There was an error! Send a screenshot of this info to Momin or Amanda!\n\n` + JSON.stringify(args))
}
window.addEventListener('unhandledrejection', function(e) {
    alert(`There was an error! Send a screenshot of this info to Momin or Amanda!\n\n` + e.reason)
});

// config
const BASE_URL = 'https://loves.fool.games'

// api calls
const POST = {
    method: 'post',
    headers: {
        'Content-type': 'application/json',
    },
}
function reportDrawing(canvasObject) {
    fetch(BASE_URL + '/inprogress/drawing', {
        method: 'post',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            id: 0,
            drawing: staticCanvas.toObject(),
        })
    })
}
function reportAdd(canvasObject) {
    fetch(DRAWING_INPROGRESS_URL, {
        ...POST,
        body: JSON.stringify({
            id: 0,
            action: 'ADD',
            timestamp: performance.now(),
            data: canvasObject.toObject(),
        })
    })
}
function reportRemove(objectIndex) {
    fetch(DRAWING_INPROGRESS_URL, {
        ...POST,
        body: JSON.stringify({
            id: 0,
            action: 'REMOVE',
            timestamp: performance.now(),
            data: objectIndex,
        })
    })
}
function reportClear() {
    fetch(DRAWING_INPROGRESS_URL, {
        method: 'post',
        headers: {
            'Content-type': 'application/json',
        },
        body: JSON.stringify({
            id: 0,
            action: 'CLEAR',
            timestamp: performance.now(),
            data: objectIndex,
        })
    })
}

// callout banner color anim
function doBannerAnim(title, letters) {
    title.borderToggle = !title.borderToggle
    title.style.setProperty('--wave-border-x', (title.borderToggle ? 29 : 30) + 'px')
    title.style.setProperty('--wave-border-y', (title.borderToggle ? 4 : 355) + 'px')
    letters.forEach(letter => {
        letter.style.transform = `translateX(${lerp(-1.5, 1.5, Math.random())}%) translateY(${lerp(-2.5, 2.5, Math.random())}%) rotate(${lerp(-9, 9, Math.random())}deg)`
        letter.style.setProperty('--color-angle', `${lerp(0, 360, Math.random())}deg`)
        letter.style.backgroundPosition = `${lerp(-100, 100, Math.random())}% ${lerp(-100, 100, Math.random())}%`
    })
}
document.querySelectorAll('.callout').forEach(callout => {
    const title = callout.querySelector('.title')
    const letters = callout.querySelectorAll('.title span')
    let intervalId = 0
    callout.addEventListener('mouseenter', e => {
        intervalId = setInterval(() => doBannerAnim(title, letters), 450)
        doBannerAnim(title, letters)
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
canvas.freeDrawingBrush.decimate = 4 // reduce # of points
// canvas.freeDrawingBrush.limitedToCanvasSize = true
canvas.wrapperEl.classList.add('wave-border')
canvas.wrapperEl.style.setProperty('--wave-border-x', 3 + 'px')
canvas.wrapperEl.style.setProperty('--wave-border-y', 104 + 'px')

const staticCanvas = new fabric.StaticCanvas('static-canvas')
staticCanvas.lowerCanvasEl.classList.add('wave-border')
staticCanvas.lowerCanvasEl.style.setProperty('--wave-border-x', 3 + 'px')
staticCanvas.lowerCanvasEl.style.setProperty('--wave-border-y', 104 + 'px')

function loadFromJSON(json) {
    if (!json?.objects) {
        return
    }
    staticCanvas.renderOnAddRemove = false
    fabric.util.enlivenObjects(json.objects, (objs) => {
        objs.forEach((item) => {
            staticCanvas.add(item)
        });
        staticCanvas.renderAll()
        staticCanvas.renderOnAddRemove = true
        historyStack.splice(0, historyStack.length)
    });
}

// resizing
let prevCanvasWidth = 0
let prevCanvasHeight = 0
doEachAnimationFrame(() => {
    if (canvas.wrapperEl.clientWidth != prevCanvasWidth || canvas.wrapperEl.clientHeight != prevCanvasHeight) {
        canvas.setWidth(canvas.wrapperEl.clientWidth)
        canvas.setHeight(canvas.wrapperEl.clientHeight)
        canvas.renderAll()
        staticCanvas.setWidth(canvas.wrapperEl.clientWidth)
        staticCanvas.setHeight(canvas.wrapperEl.clientHeight)
        staticCanvas.renderAll()
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
const historyStack = []
let justCleared = false

// handle when new path is drawn
canvas.on('object:added', function(e) {
    historyStack.splice(0, historyStack.length)
    justCleared = false
    // reset submitted state
    submitState = SUBMIT_STATE.NONE

    // add only to static
    staticCanvas.add(e.target)
    canvas.remove(e.target)

    // save drawing
    localforage.setItem('DRAW-drawing', JSON.stringify(staticCanvas.toObject()))
})

// load drawing after page load
document.addEventListener('DOMContentLoaded', e => {
    localforage.getItem('DRAW-drawing', function(e, value) {
        value = value ?? localStorage.getItem('DRAW-drawing')
        loadFromJSON(JSON.parse(value))
    });
})

// drawing controls
const undoButton = document.querySelector('.undo')
const redoButton = document.querySelector('.redo')
const clearButton = document.querySelector('.clear')

undoButton.onclick = function(e) {
    if (justCleared) {
        while (historyStack.length) {
            staticCanvas.add(historyStack.pop())
        }
        justCleared = false
    } else if (staticCanvas._objects.length) {
        const latestItem = staticCanvas._objects[staticCanvas._objects.length - 1]
        historyStack.push(latestItem)
        staticCanvas.remove(latestItem)
    }
}
redoButton.onclick = function(e) {
    if (justCleared) {
        while (historyStack.length) {
            staticCanvas.add(historyStack.pop())
        }
        justCleared = false
    } else if (historyStack.length) {
        staticCanvas.add(historyStack.pop())
    }
}
clearButton.onclick = function(e) {
    if (staticCanvas._objects.length) {
        while (staticCanvas._objects.length) {
            const latestItem = staticCanvas._objects[staticCanvas._objects.length - 1]
            historyStack.push(latestItem)
            staticCanvas.remove(latestItem)
        }
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
    } else {
        DEBUG_triggerLoadFromServer()
    }
}

doEachAnimationFrame(() => {
    undoButton.classList.toggle('disabled', !justCleared && staticCanvas._objects.length == 0 && canvas.isDrawingMode)
    redoButton.classList.toggle('disabled', !justCleared && !historyStack.length && canvas.isDrawingMode)
    clearButton.classList.toggle('disabled', staticCanvas._objects.length == 0 && canvas.isDrawingMode)
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
    const group = new fabric.Group(staticCanvas.getObjects(), null, true)
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
    const data = staticCanvas.toObject()
    data.objects.forEach(function(obj) {
        obj.left = obj.left - bounds.left
        obj.top = obj.top - bounds.top
    })
    // post data and dimensions
    fetch(BASE_URL + '/drawing', {
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
    const activeButton = submitButtons[submitState]
    activeButton.style.display = null
    submitButtonsAll
        .filter(b => b !== activeButton)
        .forEach(b => b.style.display = 'none')
    canvas.wrapperEl.classList.toggle('disable-draw', submitState === SUBMIT_STATE.INPROGRESS)
})

if (false) {
    // update in-progress state in server
    let prevInProgressDrawingLength = 0
    let prevInProgressStrokeLength = 0
    function updateInProgress() {
        const id = 0 // TODO: uuid

        if (prevInProgressDrawingLength !== staticCanvas._objects.length) {
            prevInProgressDrawingLength = staticCanvas._objects.length

            fetch(BASE_URL + `/inprogress/${id}/drawing`, {
                method: 'post',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(staticCanvas.toObject()),
            })
        }

        const brush = canvas.freeDrawingBrush
        if (prevInProgressStrokeLength !== brush._points.length) {
            prevInProgressStrokeLength = brush._points.length

            // copied from PencilBrush._finalizeAndAddPath()
            const points = brush.decimatePoints(brush._points, brush.decimate)
            const svg = brush.convertPointsToSVGPath(points).join('')
            const path = brush.createPath(svg);

            fetch(BASE_URL + `/inprogress/${id}/stroke`, {
                method: 'post',
                headers: {
                    'Content-type': 'application/json',
                },
                body: JSON.stringify(path.toObject()),
            })
        }
    }
    setInterval(updateInProgress, 0.6 * 1000)
}

// utility to replace current drawing with JSON from server
let DEBUG_loadFromServerCounter = 0
const DEBUG_resetLoadFromServerCounter = debounce(() => {
    DEBUG_loadFromServerCounter = 0
}, 600)
function DEBUG_triggerLoadFromServer() {
    DEBUG_loadFromServerCounter++
    if (DEBUG_loadFromServerCounter > 5) {
        DEBUG_loadFromServer(prompt('Paste the code that you were given to load your drawing', ''))
        DEBUG_loadFromServerCounter = 0
    }
    DEBUG_resetLoadFromServerCounter()
}
function DEBUG_loadFromServer(id) {
    if (!id || !id.toString()) {
        return
    }
    fetch(DRAWING_POST_URL + '/' + id)
        .then(res => res.json())
        .then(json => {
            clearButton.dispatchEvent(new Event('click'))
            loadFromJSON(json)
        })
}
