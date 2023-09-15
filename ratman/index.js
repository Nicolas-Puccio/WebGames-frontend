ws = new WebSocket('ws://webgamesuseast.onrender.com')

//#region Setup


const nameSelection = () => {
    const playerName = document.getElementById("playerName").value
    setFormDisabled(true)
    ws.send(JSON.stringify({ type: 'name_selection', playerName }))
}



const setFormDisabled = disabled => {
    const form = document.getElementById('nameSelection')
    const elements = form.querySelectorAll('input, button')

    elements.forEach(element => {
        element.disabled = disabled
    })
}



ws.onmessage = data => {
    const parsedData = JSON.parse(data.data)
    console.log(parsedData)

    switch (parsedData.type) {
        case 'name_validation':
            name_validation(parsedData.playerName)
            break;
        case 'update':
            if (document.getElementById('waiting'))
                document.getElementById('waiting').remove()

            update(parsedData.matrix, parsedData.turn, parsedData.left)
            break;
    }
}


const name_validation = _playerName => {
    if (_playerName !== '') {//'' means not valid for server
        playerName = _playerName
        const form = document.getElementById('nameSelection')
        form.remove()
        ws.send(JSON.stringify({ type: 'room_join', game: 'rats' }))
        document.getElementById('waiting').innerHTML = 'waiting for another player'
    }
    else {
        setFormDisabled(false)
    }
}
//#endregion

let playerName
let matrix
let turn//name of player's turn
let isLeft//am i the left player
let startingRats = 0
let scoreLeft = 0
let scoreRight = 0



const update = (_matrix, _turn, _left) => {
    turn = _turn

    isLeft = isLeft ?? _left === playerName

    if (!matrix) {

        //#region build html table

        const table = document.getElementById("game")

        //creates game grid
        for (let i = 0; i < _matrix.length; i++) {
            const tr = document.createElement("tr")
            for (let j = 0; j < _matrix[0].length; j++) {
                const td = document.createElement("td")
                td.setAttribute('id', `${i}-${j}`)
                tr.appendChild(td)
            }
            table.appendChild(tr)
        }

        //creates input rows
        for (let i = 0; i < 2; i++) {
            const tr = document.createElement("tr")

            for (let j = 0; j < _matrix[0].length; j++) {
                const td = document.createElement("td")
                td.setAttribute('id', `${_matrix.length + i}-${j}`)
                tr.appendChild(td)
            }

            table.appendChild(tr)
        }
        //#endregion
        console.log(_matrix)
        console.log(_matrix.length)//12
        console.log(_matrix[0].length)//20
    }
    matrix = _matrix
    console.log(matrix)


    clearInterval(tickInterval)
    updateTable()
    tick()
}



const updateTable = () => {
    ratsLeft = 0
    ratsRight = 0

    //populate images
    console.log(matrix)
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[0].length; j++) {
            document.getElementById(`${i}-${j}`).className = `image${matrix[i][j]}`

            //count rats to check gameover
            if (matrix[i][j] === 2)
                ratsLeft++
            if (matrix[i][j] === 3)
                ratsRight++
        }
    }



    //check for gameover //-shown twice
    if (ratsLeft === 0 && ratsRight === 0) {
        alert('DRAW')
        console.error('draw')
    }
    else if (ratsLeft === 0) {
        alert('LEFT WINS')
        console.error('left')
    }
    else if (ratsRight === 0) {
        alert('RIGHT WINS')
        console.error('right')
    }



    //-should move this?
    if (startingRats === 0) {
        startingRats = ratsLeft
    }
    else {//set scores
        document.getElementById('scoreLeft').innerHTML = `score Left: ${startingRats - ratsLeft}`
        document.getElementById('scoreRight').innerHTML = `score Right: ${startingRats - ratsRight}`
    }
}



const tick = () => {
    ticking = true

    //defaults to true, set by movementTick()
    let movementFlag = true

    //calls movement until none is detected, then enables input row
    tickInterval = setInterval(() => {
        if (!movementFlag) {
            clearInterval(tickInterval)
            console.log(`Stopped loop`)
            //-check for score updates
            ticking = false
            if (turn === playerName)
                enableInput()
        }
        movementFlag = movementTick()
        updateTable()
    }, 50)//tick interval


    //what would be the best way to optimize this?
}




const enableInput = () => {
    for (let j = 0; j < matrix[0].length; j++) {
        for (let i = 0; i < matrix.length; i++) {
            if (document.getElementById(`${i}-${j}`).className === 'image2' && isLeft ||
                document.getElementById(`${i}-${j}`).className === 'image3' && !isLeft) {

                document.getElementById(`${matrix.length}-${j}`).className = 'inputup'
                document.getElementById(`${matrix.length}-${j}`).onclick = () => input(j, true)
                document.getElementById(`${matrix.length + 1}-${j}`).className = 'inputdown'
                document.getElementById(`${matrix.length + 1}-${j}`).onclick = () => input(j, false)
                break
            }
        }
    }
}



const disableInput = () => {
    for (let j = 0; j < matrix[0].length; j++) {
        document.getElementById(`${matrix.length}-${j}`).className = 'noinput'
        document.getElementById(`${matrix.length}-${j}`).onclick = () => null
        document.getElementById(`${matrix.length + 1}-${j}`).className = 'noinput'
        document.getElementById(`${matrix.length + 1}-${j}`).onclick = () => null
    }
}


/**
 * called by clicking the arrows below the matrix
 * @param {*} columnIndex
 * @param {*} isUpArrow
 * @returns 
 */
const input = (columnIndex, isUpArrow) => {
    disableInput()

    //won't be my turn anymore
    turn = null

    console.log(columnIndex, isUpArrow)


    if (isUpArrow) {
        const aux = matrix[0][columnIndex]
        for (let i = 1; i < matrix.length; i++) {
            matrix[i - 1][columnIndex] = matrix[i][columnIndex]
        }
        matrix[matrix.length - 1][columnIndex] = aux
    }
    else {//down arrow
        const aux = matrix[matrix.length - 1][columnIndex]
        for (let i = matrix.length - 2; i >= 0; i--) {
            matrix[i + 1][columnIndex] = matrix[i][columnIndex]
        }
        matrix[0][columnIndex] = aux
    }



    //send new matrix to the server, total client authority, 100% vulnerable
    ws.send(JSON.stringify({ type: 'rats_event', action: 'userinput', matrix }))
}







let tickInterval // returned by setInterval
let ticking = false // true stops user input


/**
 * Moves rats
 * @returns if any movement was performed
 */
const movementTick = () => {

    //returns true if a rat dropped a tile
    if (gravityTick())
        return true

    //starts looping rows from bottom to top
    for (let i = matrix.length - 1; i >= 0; i--) {

        //loops columns left to right
        for (let j = 0; j < matrix[0].length; j++) {

            if (matrix[i][j] === 2) {//if this is a left rat, go right

                //reached the end of the matrix
                if (j + 1 === matrix[0].length) {
                    matrix[i][j] = 0
                }

                //check if i can move
                else if (matrix[i][j + 1] === 0) {
                    matrix[i][j + 1] = matrix[i][j]
                    matrix[i][j] = 0
                    return true
                }
            }


            if (matrix[i][j] === 3) {//if this is a right rat, go left

                //reached the end of the matrix
                if (j === 0) {
                    matrix[i][j] = 0
                }

                //check if i can move
                else if (matrix[i][j - 1] === 0) {
                    matrix[i][j - 1] = matrix[i][j]
                    matrix[i][j] = 0
                    return true
                }
            }
        }
    }

    //returns false if no movement was performed by the gravityTick or loops
    return false
}



/**
 * checks if a rat should drop a tile
 * @returns if a rat dropped a tile
 */
const gravityTick = () => {

    //makes more sense to begin from below right? purposely ignoring most bottom row
    for (let i = matrix.length - 2; i >= 0; i--) {

        //loop left to right
        for (let j = 0; j < matrix[0].length; j++) {


            //if this is a rat
            if (matrix[i][j] === 2 || matrix[i][j] === 3) {

                //if there is nothing under the rat
                if (matrix[i + 1][j] === 0) {
                    matrix[i + 1][j] = matrix[i][j]
                    matrix[i][j] = 0
                    return true
                }
            }
        }
    }

    //returns false if no rat dropped a tile
    return false
}