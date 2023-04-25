import { showInfoPane, hideInfoPane } from './infoPane'
import { store } from './store'

const outputImage = document.querySelector('#compressed_image')

//to display images when all images are computed and data urls are set
export function display(image_id) {
  store.set('displayedImageId', image_id)
  display_compressed_image(image_id, outputImage, 'highQuality')
}

export async function create_image_blobs(
  height,
  width,
  bufferArray,
  imageData,
  numberOfRanks,
  mode
) {
  const image_size = height * width * 4
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = width
  canvas.height = height

  if (mode === 'preview') {
    imageData.data.set(bufferArray.subarray(0, image_size))
    context.putImageData(imageData, 0, 0)

    const blob = await getBlob(
      canvas,
      store.get('outputImageType'),
      store.get('imageAlgorithmQualities')[0]
    )

    store.set('previewBlob', blob)

    return blob
  }
  const promises = []
  for (let i = 0; i < numberOfRanks; i++) {
    // set underlying data of imageData object of canvas to subarray of bufferArray which contains the (i+1)th compressed image
    imageData.data.set(
      bufferArray.subarray(image_size * i, image_size * (i + 1))
    )

    context.putImageData(imageData, 0, 0)
    promises.push(
      getBlob(
        canvas,
        store.get('outputImageType'),
        store.get('imageAlgorithmQualities')[i]
      )
    )
  }
  const blobs = await Promise.all(promises)

  const imageType = store.get('outputImageType')

  store.set('imagesBlobs', { [imageType]: blobs })
}

export function display_compressed_image(image_id, outputImage, mode) {
  const blob =
    mode === 'preview'
      ? store.get('previewBlob')
      : store.get('imagesBlobs')[store.get('outputImageType')][image_id]

  const urlCreator = window.URL || window.webkitURL
  if (!blob) return
  const src = urlCreator.createObjectURL(blob)
  outputImage.src = src
  const downloadAnchor = document.querySelector('#downloadLink')
  downloadAnchor.href = src
  console.log(`Expected size: ${Math.round(blob.size / 1000, 2)} KB`)
  showInfoPane({
    outputImageSize: `${Math.round(blob.size / 1000, 2)} KB`,
  })
}

export function display_separator() {
  const separator = document.querySelector('#quality_separator')
  separator.classList.add('visible')

  const input_canvas = document.querySelector('#input_canvas')
  const separator_svg = document.querySelector('#quality_separator_icon')
  separator_svg.style.removeProperty('visibility')

  // this setTimeout is needed to make sure this runs AFTER
  // layout has been computed and the width of the input canvas
  // is updated
  // see https://stackoverflow.com/questions/779379/why-is-settimeoutfn-0-sometimes-useful
  setTimeout(() => {
    const img_width = input_canvas.getBoundingClientRect().width
    document.documentElement.style.setProperty(
      '--split-point',
      `${img_width / 2}px`
    )
  }, 0)
}

export function get_cursor_position_relative_to_element(element, event) {
  const rect = element.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  const elementWidth = rect.right - rect.left
  return [clamp(x, 0, elementWidth), y]
}

export function get_percentage_from_x(x, element) {
  const rect = element.getBoundingClientRect()
  const width = rect.width
  return 100 - (x / width) * 100
}

export function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max)
}

export function updateSeparator() {
  const percentage =
    document.documentElement.style.getPropertyValue(
      '--split-point-percentage'
    ) || '50%'

  const canvas = document.querySelector('#input_canvas')
  const width = canvas.getBoundingClientRect().width
  const x = width - (percentage.replace('%', '') / 100) * width

  document.documentElement.style.setProperty('--split-point', `${x}px`)
}

export function getBlob(canvas, imageType, imageQuality) {
  console.log({ imageType, imageQuality, canvas })
  return new Promise((resolve) =>
    canvas.toBlob(resolve, `image/${imageType}`, imageQuality)
  )
}

export function reset() {
  store.reset()
  hideInfoPane()
  const rangeQualityInput = document.querySelector('#qualityRange')
  rangeQualityInput.value = 0
  document.documentElement.style.setProperty('--split-point-percentage', `50%`)
}

export function isImageFile(inputFile) {
  return inputFile.type.includes('image')
}

export function sendImageFile(inputFile) {
  if (!inputFile || !isImageFile(inputFile)) {
    return
  }

  const outputImage = document.querySelector('#compressed_image')
  const imageBoxWrapper = document.querySelector('#wrapper')
  const uploadButton = document.querySelector('#uploadBtn')
  const wrapper = document.querySelector('#wrapper')
  const canvas = document.querySelector('#input_canvas')

  const numberOfRanks = 6

  const myWorker = store.get('worker')

  reset()

  const initialFileSize = inputFile.size / 1024
  console.log(`Initial size: ${Math.round(initialFileSize, 2)} KB`)

  outputImage.src = '#'
  uploadButton.disabled = true

  wrapper.classList.add('hidden')
  const img = document.createElement('img')
  img.src = URL.createObjectURL(inputFile)
  const context = canvas.getContext('2d', {
    willReadFrequently: true,
  })

  img.onload = function () {
    let startTime = Date.now()
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
    store.set('previewLoading', true)
    myWorker.postMessage({
      width: img.width,
      height: img.height,
      ranks: [ranks[0]],
      outputBuffer,
      preview: true,
      inputBuffer,
    })

    myWorker.onmessage = async (e) => {
      if (e.data.type === 'previewDone') {
        await create_image_blobs(
          img.height,
          img.width,

          bufferArray,
          imageData,
          1,
          'preview'
        )

        display_compressed_image(0, outputImage, 'preview')

        store.set('previewLoading', false)
        store.set('previewLoaded', true)
        imageBoxWrapper.classList.remove('hidden')
        display_separator()
        store.set('highQualityLoading', true)
        showInfoPane({
          inputImageSize: `${Math.round(initialFileSize, 2)} KB`,
          inputImageType: inputFile.type,
        })
        myWorker.postMessage({
          width: img.width,
          height: img.height,
          ranks: ranks,
          outputBuffer,
          inputBuffer,
          preview: false,
        })
      } else {
        let endTime = Date.now()

        console.log('Time taken by JS: ' + (endTime - startTime) + 'ms')
        startTime = Date.now()
        await create_image_blobs(
          img.height,
          img.width,
          bufferArray,
          imageData,
          numberOfRanks,
          'highQuality'
        )

        store.set('highQualityLoading', false)
        store.set('highQualityLoaded', true)

        //mode is set to highQuality and not preview
        display_compressed_image(
          store.get('displayedImageId'),
          outputImage,
          'highQuality'
        )
        uploadButton.disabled = false
        endTime = Date.now()
        console.log('Time taken by Canvas: ' + (endTime - startTime) + 'ms')
      }
    }
  }
}
