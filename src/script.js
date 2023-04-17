'use strict'
const filesel = document.querySelector('#fileselect')
filesel.addEventListener('change', handleimage)

function handleimage(e) {
  const fileinp = e.target

  if (fileinp.files.length) {
    const img = document.createElement('img')
    img.src = URL.createObjectURL(fileinp.files[0])
    const canvas = document.querySelector('#canvas')
    const context = canvas.getContext('2d')

    img.onload = function () {
      canvas.width = img.width
      canvas.height = img.height
      context.drawImage(img, 0, 0)
      extract_rgb(
        context.getImageData(0, 0, img.width, img.height),
        img.height,
        img.width
      )
    }
  }
}

function extract_rgb(imageData, img_len, img_width) {
  // console.log(imageData)
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
  const res = Module.get_compressed_img(
    img_len,
    img_width,
    600,
    rvec,
    gvec,
    bvec
  )
  display_compressed_image(img_len, img_width, res)
}

function display_compressed_image(img_len, img_width, rgb_pixels) {
  const canvas = document.createElement('canvas')
  const context = canvas.getContext('2d')
  canvas.width = img_width
  canvas.height = img_len

  let new_size = img_len * img_width * 4
  const dataArray = new Uint8ClampedArray(new_size)
  let j = 0
  for (let i = 0; i < rgb_pixels.size(); ) {
    dataArray[j++] = rgb_pixels.get(i++)
    dataArray[j++] = rgb_pixels.get(i++)
    dataArray[j++] = rgb_pixels.get(i++)
    dataArray[j++] = 255
  }

  let imageData = new ImageData(dataArray, img_width, img_len)

  context.putImageData(imageData, 0, 0)
  const src = canvas.toDataURL('image/webp')
  document.querySelector('#compressed_image').src = src

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
