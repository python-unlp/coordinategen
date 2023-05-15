import React, { useState } from 'react'

const App = () => {
  const GRAPH_SIZE = [600, 600]
  const [image, setImage] = useState(null)
  const [imageName, setImageName] = useState("")
  const [scaleFactor, setScaleFactor] = useState(1)
  const [boxes, setBoxes] = useState([])
  const [currentCoordPair, setCurrentCoordPair] = useState([])
  const [memes, setMemes] = useState([])
  const [currentMeme, setCurrentMeme] = useState(null)
  const [prettyPrint, setPrettyPrint] = useState(true)

  const asPngBytes = (imagePath, size = GRAPH_SIZE) => {
    const image = new Image()
    image.src = URL.createObjectURL(imagePath)

    return new Promise(resolve => {
      image.onload = () => {
        const { naturalWidth, naturalHeight } = image
        const scaleFactor = Math.min(
          size[0] / naturalWidth,
          size[1] / naturalHeight
        )

        const canvas = document.getElementById('main_canvas')
        const displayCoords = scaleCoordsFromOriginalToDisplay([naturalWidth, naturalHeight], scaleFactor)
        const ctx = canvas.getContext('2d')
        ctx.drawImage(image, 0, 0, displayCoords[0], displayCoords[1])

        canvas.toBlob(blob => {
          resolve([blob, scaleFactor])
        }, 'image/png')
      }
    })
  }


  const scaleCoordsBackToOriginal = (coords, scaleFactor) => {
    const scaledCoords = coords.map(coord => Math.floor(coord / scaleFactor))
    return scaledCoords
  }

  const scaleCoordsFromOriginalToDisplay = (coords, scaleFactor) => {
    const scaledCoords = coords.map(coord => Math.floor(coord * scaleFactor))
    return scaledCoords
  }

  const handleImageChange = event => {
    const file = event.target.files[0]
    const canvas = document.getElementById('main_canvas')
    const context = canvas.getContext('2d')

    if (file) {
      context.clearRect(0, 0, canvas.width, canvas.height)
      if (currentMeme !== undefined && currentMeme !== null) {
        setMemes([...memes, currentMeme])
      }
      setBoxes([])
      setCurrentMeme(null)
      setImageName(event.target.files[0].name)
      asPngBytes(file).then(([blob, scaleFactor]) => {
        const imageUrl = URL.createObjectURL(blob)
        setImage(imageUrl)
        setScaleFactor(scaleFactor)
        setBoxes([])
        setCurrentCoordPair([])
        setCurrentMeme(null)
      })
    }
  }

  const handleCanvasClick = event => {
    if (!image) {
      return
    }

    const rect = event.target.getBoundingClientRect()
    const clickCoords = [event.clientX - rect.left, event.clientY - rect.top]

    const coords = scaleCoordsBackToOriginal(clickCoords, scaleFactor)
    //setCurrentCoordPair((prevCoords) => [...prevCoords, coords]);
    currentCoordPair.push(coords)
    setCurrentCoordPair(currentCoordPair)

    const canvas = event.target.getContext('2d')
    canvas.fillStyle = 'red'
    canvas.beginPath()
    canvas.arc(clickCoords[0], clickCoords[1], 5, 0, 2 * Math.PI)
    canvas.fill()

    if (currentCoordPair.length >= 2) {
      const boxCoords = [
        scaleCoordsFromOriginalToDisplay(currentCoordPair[0], scaleFactor),
        clickCoords
      ]

      canvas.beginPath()
      canvas.strokeStyle = 'red'
      canvas.rect(
        boxCoords[0][0],
        boxCoords[0][1],
        boxCoords[1][0] - boxCoords[0][0],
        boxCoords[1][1] - boxCoords[0][1]
      )
      canvas.stroke()
      const updatedBoxes = [...boxes, currentCoordPair]
      setBoxes(updatedBoxes)
      setCurrentCoordPair([])
      setCurrentMeme({
        image: imageName,
        name: "Some description",
        text_boxes: updatedBoxes.map(box => ({
          top_left_x: box[0][0],
          top_left_y: box[0][1],
          bottom_right_x: box[1][0],
          bottom_right_y: box[1][1]
        }))
      })
    }
  }

  const togglePrettyPrint = () => {
    setPrettyPrint(!prettyPrint)
  }

  return (
    <div class='row'>
      <div class='column'>
        <input type='file' onChange={handleImageChange} accept='.jpg, .png' />
        <br />
        <canvas
          id='main_canvas'
          width={GRAPH_SIZE[0]}
          height={GRAPH_SIZE[1]}
          style={{ backgroundColor: 'black' }}
          onClick={handleCanvasClick}
        >
          Your browser does not support the HTML5 canvas element.
        </canvas>
        <br/>
        <input
          type='checkbox'
          checked={prettyPrint}
          onChange={togglePrettyPrint}
        />
        <label>Pretty-print</label>
      </div>
      <div class='column'>
        <label>Meme template</label>
        <textarea
          rows={20}
          cols={80}
          value={JSON.stringify(
            memes.concat(currentMeme),
            null,
            prettyPrint ? 4 : 0
          )}
          readOnly
        />

        <label>Coordenadas:</label>
        <textarea
          rows={20}
          cols={80}
          value={
            boxes.length > 0?
            `${boxes[boxes.length - 1][0]} -> ${boxes[boxes.length - 1][1]}\n`:''
          }
          readOnly
        />
      </div>
    </div>
  )
}

export default App
