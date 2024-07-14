ws = new WebSocket('wss://webgamesuswest.onrender.com')
//ws = new WebSocket('ws://localhost:3001')

//#region Setup


const nameSelection = () => {
  const playerName = document.getElementById("playerName").value
  setFormDisabled(true)
  try {
    ws.send(JSON.stringify({ type: 'name_selection', playerName }))
  } catch (error) {
    setFormDisabled(false)
    alert("backend still not online, please try again in 10 seconds")
  }
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
      if (!matrix) {//game not started yet, init to start now
        init(parsedData.matrix, parsedData.left, parsedData.turn)
        document.getElementById('waiting').remove()//waiting for player text
      }

      update(parsedData.matrix, parsedData.turn)
      break;
  }
}


const name_validation = _playerName => {
  if (_playerName !== '') {//'' means not valid for server
    playerName = _playerName
    document.getElementById('nameSelection').remove()

    ws.send(JSON.stringify({ type: 'room_join', game: 'rats' }))
    document.getElementById('waiting').innerHTML = 'waiting for another player'
  }
  else {
    setFormDisabled(false)
  }
}
//#endregion



let playerName
let playerName2
let matrix
let turn//name of player's turn
let isLeft//am i the left player
let startingRats = 0
let scoreLeft = 0
let scoreRight = 0
let tickRate = 50


const init = (_matrix, _left, _turn) => {
  isLeft = _left === playerName
  playerName2 = isLeft ? _turn : _left

  const table = document.getElementById("game")

  //creates game grid
  for (let i = 0; i < _matrix.length; i++) {
    const tr = document.createElement("tr")
    for (let j = 0; j < _matrix[0].length; j++) {
      if (_matrix[i][j] === 2)
        startingRats++
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
  console.log(_matrix)
  console.log(`rowsAmount:${_matrix.length}`)//12
  console.log(`columnsAmount:${_matrix[0].length}`)//20
  console.log(`startingRats:${startingRats}`)
}

const update = (_matrix, _turn, _left) => {
  turn = _turn

  matrix = _matrix
  console.log('update', matrix)


  clearInterval(tickInterval)
  updateTable()
  tick()
}



//returns positio of winning player, or nothing if not gameover
const updateTable = () => {
  ratsLeft = 0
  ratsRight = 0

  //populate images
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


  document.getElementById('scoreMe').innerHTML = `${playerName}: ${startingRats - (isLeft ? ratsLeft : ratsRight)}`
  document.getElementById('scoreOther').innerHTML = `${playerName2}: ${startingRats - (isLeft ? ratsRight : ratsLeft)}`

  //check for gameover

  if (ratsLeft === 0 && ratsRight === 0) {
    return 'draw'
  }
  else if (ratsLeft === 0) {
    return 'left'
  }
  else if (ratsRight === 0) {
    return 'right'
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

    movementFlag = movementTick()//-maybe swap this and bottom?

    const winner = updateTable()
    if (winner) {
      clearInterval(tickInterval)
      console.log(`Stopped loop`)
      ticking = false

      let msg = ''
      if (winner === 'draw')
        msg = 'It is a draw'
      else if (winner === 'left')
        msg = `${isLeft ? playerName : playerName2} wins`
      else
        msg = `${isLeft ? playerName2 : playerName} wins`

      alert(msg)
      ws.send(JSON.stringify({ type: 'rats_event', winner: true }))
      //---notifiy backend of victory
    }
  }, document.getElementById('tickRate').value)//tick interval


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

  console.log(`columnIndex:${columnIndex}, isUpArrow:${isUpArrow}`)


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
  ws.send(JSON.stringify({ type: 'rats_event', matrix }))
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