if (!Module) {
  var Module = {
    locateFile: (path) => {
      // the emcc glue code will look for the wasm file in the same directory as the js file
      // we override this behavior by returning the path to the public directory
      return `/${path}`
    },
  }
}
self.importScripts('/a.out.js')

// we check this because for some odd reason, emcc decides it will be a good idea
// to run this code inside of their workers(the pthread ones) as well - which results in their
// onmessage being overwritten by ours. This is a hacky way to prevent that
if (!onmessage) {
  onmessage = (e) => {
    const { height, width, buffer } = e.data

    let bufferArray = new Uint8ClampedArray(buffer)

    extract_rgb(bufferArray, height, width)

    //Now bufferArray holds the compressed image
    //send message to main to display the compressed image
    postMessage('Display Compressed Image')
  }
}
function extract_rgb(bufferArray, img_height, img_width) {
  // we have a total of 4 bytes per pixel
  // and we have img_len * img_width pixels
  // so total length is img_len * img_width * 4
  const bufferLength = img_height * img_width * 4

  // allocate memory on the heap(this can be accessed from within C++ preventing an expensive copy)
  // and get a pointer to it(this is the address of the first byte of the allocated memory)
  // since the max value of each channel is 256, we have 1 byte per channel
  const imageBufferStart = Module._malloc(bufferLength * 1)
  Module.HEAPU8.set(bufferArray, imageBufferStart)

  // this returns nothing - it just modifies the buffer
  Module.get_compressed_img(img_height, img_width, 200, imageBufferStart)

  // create a new Uint8Array view on the same memory
  // and set the values of the view to the values of the heap
  bufferArray.set(
    Module.HEAPU8.subarray(imageBufferStart, imageBufferStart + bufferLength)
  )

  // and now, free the memory to prevent memory leaks
  Module._free(imageBufferStart)
}
