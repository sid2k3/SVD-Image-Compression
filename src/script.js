import { store } from './store'
import { sendImageFile } from './utils'

const myWorker = new Worker(new URL('./worker.js', import.meta.url))
store.set('worker', myWorker)

store.set('displayedImageId', 0)

const fileSelector = document.querySelector('#fileselect')

fileSelector.addEventListener('change', handleImage)

function handleImage(e) {
  const inputFile = e.target.files[0]

  //return if no file is selected
  if (e.target.files.length === 0) {
    return
  }

  if (e.target.files.length) {
    sendImageFile(inputFile)
  }
}
