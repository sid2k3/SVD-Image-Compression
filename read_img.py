from PIL import Image
from numpy import asarray
import numpy as np
import subprocess


# load the image and convert into
# numpy array


def img_to_matrix():
    img = Image.open("sample.jpg")
    width, height = img.size

    # asarray() class is used to convert
    # PIL images into NumPy arrays
    img = img.convert("RGB")
    numpydata = asarray(img)

    print(numpydata)

    numpydata.tofile("mat.txt", sep=" ", format="%s")
    cpp_output = subprocess.run(["./a.exe", f"{height}", f"{width}"])
    print(f"CPP program ran with exit code: {cpp_output.returncode}")
    return (height, width)


def matrix_to_img(height, width):
    File_data = np.loadtxt("compressed_mat.txt", dtype=np.uint8)
    print(File_data.shape)
    File_data = File_data.reshape(height, width, 3)

    # img = Image.open("sample.jpg")

    # asarray() class is used to convert
    # PIL images into NumPy arrays
    # numpydata = asarray(img)

    print(type(File_data))
    # print(File_data)

    pilImage = Image.fromarray(File_data)
    print(type(pilImage))
    pilImage.save("modified.webp")
    # Let us check  image details

    print(pilImage.size)


height, width = img_to_matrix()

matrix_to_img(height, width)
