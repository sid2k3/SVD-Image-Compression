# SVD On Device Image Compression


A simple and convenient client side tool to compress images. 

Compression is implemented using [Singular Value Decomposition](https://en.wikipedia.org/wiki/Singular_value_decomposition) and is written in C++ which is then compiled to Web Assembly(under 500 bytes when gzipped!)

You can read about how we went about developing this application here - [Writing for Web Assembly](https://thetrio.dev/blog/2023-04-26-WebAssembly/)
   
![Screenshot 2023-04-26 040749](https://user-images.githubusercontent.com/100620626/234419329-a01aaa6b-6607-4305-9d19-07d300beab4d.png)

***Note**:- The current version can support images up to 4k resolution*

## How to develop

Install the dependencies

```bash
yarn
```

Then start the dev server

```bash
yarn dev
```

## How to build

```bash
yarn build
```

If you wish to start a production server

```bash
yarn serve
```
