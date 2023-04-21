const myWorker = new Worker('src/worker.js')

// number of ranks for which compressed image is to be computed
const numberOfRanks = 6

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

      const ranks = []
      const max_rank = Math.min(img.height, img.width)
      for (let i = 1; i <= numberOfRanks; i++) {
        ranks.push(Math.min(max_rank * (i / 10), 70 * i))

        //calculates new ranks from 10% of original rank to number of ranks % of original ranks (currently 60%).

        /*
        Math.min(max_rank * (i / 10), 70 * i) imposes an upper limit on rank.
        This is done to calculate lower ranks for high dimensional images.
        In a 4k image 10% would imply a rank around 200 but due to our upper limit
        we calculate rank 70 and so on. 
        */

        //(i/10)*max_rank for i=10 would imply multiplying by 0.1 or 10%
      }
      canvas.width = img.width
      canvas.height = img.height
      context.drawImage(img, 0, 0)
      const image_size = img.width * img.height * 4
      const imageData = context.getImageData(0, 0, img.width, img.height)

      // Create a shared buffer to hold image data
      // we have a total of 4 bytes per pixel
      // and we have img_len * img_width pixels

      //since we are creating a single buffer to hold multiple(numberOfRanks) compressed images

      // therefore total length is img_len * img_width * 4*numberOfRanks
      const outputBuffer = new SharedArrayBuffer(
        img.width * img.height * 4 * numberOfRanks
      )

      // get image data in form of uint8 clamped array
      const imageDataArray = imageData.data

      let bufferArray = new Uint8ClampedArray(outputBuffer)
      let inputBuffer = new SharedArrayBuffer(image_size)
      let inputBufferArray = new Uint8ClampedArray(inputBuffer)

      // set buffer array contents to image array contents
      inputBufferArray.set(imageDataArray)

      // disable button
      myWorker.postMessage({
        width: img.width,
        height: img.height,
        ranks: [ranks[0]],
        outputBuffer,
        preview: true,
        inputBuffer,
      })

      myWorker.onmessage = (e) => {
        if (e.data.type === 'previewDone') {
          console.log('done with preview')
          imageData.data.set(bufferArray.subarray(0, image_size))
          display_compressed_image(img.height, img.width, imageData)
          myWorker.postMessage({
            width: img.width,
            height: img.height,
            ranks: ranks,
            outputBuffer,
            inputBuffer,
            preview: false,
          })
        } else {
          const endTime = Date.now()

          console.log('Time taken by JS: ' + (endTime - startTime) + 'ms')

          // set underlying data of imageData object of canvas to bufferArray which contains the compressed image
          imageData.data.set(
            bufferArray.subarray(image_size * 5, image_size * 6)
          )

          display_compressed_image(img.height, img.width, imageData)
        }
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
