const myWorker = new Worker('src/worker.js')

const fileSelector = document.querySelector('#fileselect')
const outputImage = document.querySelector('#compressed_image')

fileSelector.addEventListener('change', handleImage)

function handleImage(e) {
  const inputFile = e.target
  const initialFileSize = inputFile.files[0].size / 1024
  console.log(`Initial size: ${Math.round(initialFileSize, 2)} KB`)

  if (inputFile.files.length) {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(inputFile.files[0])
    const canvas = document.querySelector('#canvas')
    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    })

    img.onload = function () {
      const startTime = Date.now()

      canvas.width = img.width
      canvas.height = img.height
      context.drawImage(img, 0, 0)

      const imageData = context.getImageData(0, 0, img.width, img.height)

      // Create a shared buffer to hold image data
      // we have a total of 4 bytes per pixel
      // and we have img_len * img_width pixels
      // so total length is img_len * img_width * 4
      const buffer = new SharedArrayBuffer(img.width * img.height * 4)

      // get image data in form of uint8 clamped array
      const imageDataArray = imageData.data

      let bufferArray = new Uint8ClampedArray(buffer)

      // set buffer array contents to image array contents
      bufferArray.set(imageDataArray)

      // disable button
      myWorker.postMessage({
        width: img.width,
        height: img.height,
        buffer: buffer,
      })

      myWorker.onmessage = () => {
        const endTime = Date.now()

        console.log('Time taken by JS: ' + (endTime - startTime) + 'ms')

        // set underlying data of imageData object of canvas to bufferArray which contains the compressed image
        imageData.data.set(bufferArray)

        display_compressed_image(img.height, img.width, imageData)
      }
    }
  }
}

function display_compressed_image(img_height, img_width, imageData) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = img_width
  canvas.height = img_height

  context.putImageData(imageData, 0, 0)

  const src = canvas.toDataURL('image/webp')
  outputImage.src = src

  let base64Length = src.length - (src.indexOf(',') + 1)
  let padding =
    src.charAt(src.length - 2) === '='
      ? 2
      : src.charAt(src.length - 1) === '='
      ? 1
      : 0
  let fileSize = base64Length * 0.75 - padding
  console.log(`Expected size: ${Math.round(fileSize / 1000, 2)} KB`)
}
