import { display_compressed_image, display_separator } from './utils'
import { store } from './store'
const myWorker = new Worker(new URL('./worker.js', import.meta.url))

// number of ranks for which compressed image is to be computed
const numberOfRanks = 6

const fileSelector = document.querySelector('#fileselect')
const outputImage = document.querySelector('#compressed_image')
const imageBox = document.querySelector('#imagebox')

fileSelector.addEventListener('change', handleImage)

function handleImage(e) {
  const inputFile = e.target

  //return if no file is selected
  if (inputFile.files.length === 0) {
    return
  }

  const initialFileSize = inputFile.files[0].size / 1024
  console.log(`Initial size: ${Math.round(initialFileSize, 2)} KB`)

  if (inputFile.files.length) {
    //remove previous compressed image
    outputImage.src = '#'
    const img = document.createElement('img')
    img.src = URL.createObjectURL(inputFile.files[0])
    const canvas = document.querySelector('#input_canvas')
    const context = canvas.getContext('2d', {
      willReadFrequently: true,
    })

    img.onload = function () {
      const startTime = Date.now()

      const ranks = []
      const max_rank = Math.min(img.height, img.width)
      for (let i = 1; i <= numberOfRanks; i++) {
        ranks.push(Math.min(max_rank * (i / 10), 50 * i))

        //calculates new ranks from 10% of original rank to number of ranks % of original ranks (currently 60%).

        /*
        Math.min(max_rank * (i / 10), 50 * i) imposes an upper limit on rank.
        This is done to calculate lower ranks for high dimensional images.
        In a 4k image 10% would imply a rank around 200 but due to our upper limit
        we calculate rank 50 and so on. 
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
      fileSelector.classList.add('hidden')
      store.set('previewLoading', true)
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
          imageData.data.set(bufferArray.subarray(0, image_size))
          display_compressed_image(
            img.height,
            img.width,
            imageData,
            outputImage
          )
          store.set('previewLoading', false)
          store.set('previewLoaded', true)
          imageBox.style.removeProperty('display')
          display_separator()
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

          display_compressed_image(
            img.height,
            img.width,
            imageData,
            outputImage
          )
        }
      }
    }
  }
}
