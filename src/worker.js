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
    if (e.data.preview) {
      const { height, width, ranks, inputBuffer, outputBuffer } = e.data

      let outputBufferArray = new Uint8ClampedArray(outputBuffer)
      let inputBufferArray = new Uint8ClampedArray(inputBuffer)

      compress(inputBufferArray, outputBufferArray, height, width, ranks)

      postMessage({ type: 'previewDone' })
      return
    }
    const { height, width, ranks, inputBuffer, outputBuffer } = e.data

    let outputBufferArray = new Uint8ClampedArray(outputBuffer)
    let inputBufferArray = new Uint8ClampedArray(inputBuffer)

    compress(inputBufferArray, outputBufferArray, height, width, ranks)

    //Now bufferArray holds the compressed image
    //send message to main to display the compressed image
    postMessage('Display Compressed Image')
  }
}
function compress(
  inputBufferArray,
  outputBufferArray,
  img_height,
  img_width,
  ranks
) {
  // we have a total of 4 bytes per pixel
  // and we have img_len * img_width pixels

  //since we are creating a single buffer to hold multiple(numberOfRanks) compressed images

  // therefore total length is img_len * img_width * 4*numberOfRanks

  const outputBufferLength = img_height * img_width * 4 * ranks.length

  // allocate memory on the heap(this can be accessed from within C++ preventing an expensive copy)
  // and get a pointer to it(this is the address of the first byte of the allocated memory)
  // since the max value of each channel is 256, we have 1 byte per channel

  //Create C++ vector from list of ranks
  const ranksVector = new Module.VectorInt()
  for (let rank of ranks) {
    ranksVector.push_back(rank)
  }

  const imageBufferStart = Module._malloc(outputBufferLength * 1)
  Module.HEAPU8.set(inputBufferArray, imageBufferStart)

  // this returns nothing - it just modifies the buffer
  Module.run(img_height, img_width, ranksVector, imageBufferStart)
 

  // create a new Uint8Array view on the same memory
  // and set the values of the view to the values of the heap
  outputBufferArray.set(
    Module.HEAPU8.subarray(
      imageBufferStart,
      imageBufferStart + outputBufferLength
    )
  )
  Module._free(imageBufferStart)
}
