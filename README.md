# SVD On Device Image Compression

A simple and convenient client side tool to compress images. 

Compression is implemented using [Singular Value Decomposition](https://en.wikipedia.org/wiki/Singular_value_decomposition) and is written in C++ which is then compiled to Web Assembly(under 500 bytes when gzipped!)

![Screenshot_20230425_020130](https://user-images.githubusercontent.com/10794178/234109860-a78768db-ece9-4b87-ae68-458e2ed9be93.png)
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
