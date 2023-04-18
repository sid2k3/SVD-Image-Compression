'use strict'
const filesel = document.querySelector('#fileselect')
const outputImage = document.querySelector('#compressed_image')

filesel.addEventListener('change', handleimage)

function handleimage(e) {
  const fileinp = e.target

  if (fileinp.files.length) {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(fileinp.files[0])
    const canvas = document.querySelector('#canvas')
    const context = canvas.getContext('2d')

    img.onload = function () {
      const startTime = Date.now()

      canvas.width = img.width
      canvas.height = img.height
      context.drawImage(img, 0, 0)

      extract_rgb(
        context.getImageData(0, 0, img.width, img.height),
        img.height,
        img.width
      )

      const endTime = Date.now()

      console.log('Time taken by JS: ' + (endTime - startTime) + 'ms')
    }
  }
}

function extract_rgb(imageData, img_len, img_width) {
  const rvec = new Module.VectorDouble()
  const gvec = new Module.VectorDouble()
  const bvec = new Module.VectorDouble()
  let i = 0

  while (i < imageData.data.length) {
    rvec.push_back(imageData.data[i++])
    gvec.push_back(imageData.data[i++])
    bvec.push_back(imageData.data[i++])

    i++
  }
  console.log(rvec.size())

  // we have a total of 4 bytes per pixel
  // and we have img_len * img_width pixels
  // so total length is img_len * img_width * 4
  const bufferLength = img_len * img_width * 4

  // allocate memory on the heap(this can be accessed from within C++ preventing an expensive copy)
  // and get a pointer to it(this is the address of the first byte of the allocated memory)
  // since the max value of each channel is 256, we have 1 byte per channel
  const bufferStart = Module._malloc(bufferLength * 1)

  // this returns nothing - it just modifies the buffer
  Module.get_compressed_img(
    img_len,
    img_width,
    10,
    rvec,
    gvec,
    bvec,
    bufferStart,
    bufferLength
  )

  // create a new Uint8Array view on the same memory
  // and set the values of the view to the values of the heap
  imageData.data.set(
    Module.HEAPU8.subarray(bufferStart, bufferStart + bufferLength),
    0
  )

  // and finally, show the image
  display_compressed_image(img_len, img_width, imageData)
}

function display_compressed_image(img_len, img_width, imageData) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = img_width
  canvas.height = img_len

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
  console.log(fileSize)
}
