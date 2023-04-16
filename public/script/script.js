
filesel = document.querySelector("#fileselect"),
    filesel.addEventListener("change", handleimage);


function handleimage(e) {

    fileinp = e.target

    if (fileinp.files.length) {

        const img = document.createElement("img");
        img.src = URL.createObjectURL(fileinp.files[0]);
        const canvas = document.querySelector("#canvas");
        context = canvas.getContext('2d');



        img.onload = function () {
            canvas.width = img.width
            canvas.height = img.height
            context.drawImage(img, 0, 0);
            extract_rgb(context.getImageData(0, 0, img.width, img.height), img.height, img.width)
        }



    }


}

function extract_rgb(imageData, img_len, img_width) {
    const rvec = new Module.VectorDouble()
    const gvec = new Module.VectorDouble()
    const bvec = new Module.VectorDouble()
    let i = 0;

    while (i < imageData.data.length) {
        rvec.push_back(imageData.data[i++]);
        gvec.push_back(imageData.data[i++]);
        bvec.push_back(imageData.data[i++]);

        i++;
    }
    console.log(rvec.size())
    const res = Module.get_compressed_img(img_len, img_width, 10, rvec, gvec, bvec)
    console.log(res.size())
}