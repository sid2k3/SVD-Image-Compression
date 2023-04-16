# SVD On Device Image Compression

## How to build

```bash
emcc -I external_libs/eigen-3.4.0 -I external_libs/RedSVD/ main.cpp --bind  -s ALLOW_MEMORY_GROWTH=1
```
