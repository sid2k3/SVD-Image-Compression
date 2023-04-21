#include <iostream>
#include <Eigen/Dense>
#include <fstream>
#include <iterator>
#include <RedSVD-h>
#include <cmath>
#include <thread>
#include <future>
#include <emscripten/bind.h>
#include <stdio.h>

using namespace emscripten;

Eigen::MatrixXd get_compressed_image(Eigen::MatrixXd &mat, int rank, char component)
{

    RedSVD::RedSVD<Eigen::MatrixXd> mtr(mat, rank);

    Eigen::MatrixXd U = mtr.matrixU();

    Eigen::MatrixXd S = Eigen::MatrixXd(mtr.singularValues().asDiagonal());
    Eigen::MatrixXd V = mtr.matrixV();
    V.transposeInPlace();

    Eigen::MatrixXd compressed = U * S * V;

    printf("%c component compressed\n", component);
    return compressed;
}

double roundValue(double value)
{
    if (value > 255)
    {
        return 255;
    }
    else if (value < 0)
    {
        return 0;
    }
    return lround(value);
}
void reconstruct_image(Eigen::MatrixXd &img_r, Eigen::MatrixXd &img_g, Eigen::MatrixXd &img_b, uintptr_t bufferStart)
{
    auto r_vec = img_r.reshaped();
    auto g_vec = img_g.reshaped();
    auto b_vec = img_b.reshaped();

    // bufferStart is a pointer to the start of the buffer allocated in JS
    // doing this allows us to write to the buffer directly
    // preventing the need to copy the data to a new vector and then copy it back to the buffer in JS
    auto final_img = reinterpret_cast<uint8_t *>(bufferStart);

    for (int i{0}, j{0}; i < r_vec.size(); i++)
    {

        final_img[j++] = roundValue(r_vec[i]);
        final_img[j++] = roundValue(g_vec[i]);
        final_img[j++] = roundValue(b_vec[i]);
        final_img[j++] = 255;
    }
}

typedef Eigen::Matrix<double, Eigen::Dynamic, Eigen::Dynamic> MyMatrix;

void compress(
    int rank,
    MyMatrix &img_r, MyMatrix &img_g, MyMatrix &img_b, uintptr_t outputImageBufferStart)
{

    std::future<Eigen::MatrixXd>
        f1 = std::async(std::launch::async, get_compressed_image, std::ref(img_r), rank, 'R');

    std::future<Eigen::MatrixXd> f2 = std::async(std::launch::async, get_compressed_image, std::ref(img_g), rank, 'G');
    std::future<Eigen::MatrixXd> f3 = std::async(std::launch::async, get_compressed_image, std::ref(img_b), rank, 'B');

    printf("C++ threads created\n");
    Eigen::
        MatrixXd compressed_img_r = f1.get();

    Eigen::
        MatrixXd compressed_img_g = f2.get();

    Eigen::
        MatrixXd compressed_img_b = f3.get();

    reconstruct_image(compressed_img_r, compressed_img_g, compressed_img_b, outputImageBufferStart);
}

// Output of each rank will have its own corressponding image buffer
void run(int len, int width, std::vector<int> ranks, uintptr_t imageBufferStart)
{

    // auto start = std::chrono::steady_clock::now();

    auto inputImagePixels = reinterpret_cast<uint8_t *>(imageBufferStart);
    double *r_ptr = new double[len * width];
    double *g_ptr = new double[len * width];
    double *b_ptr = new double[len * width];

    for (int i{0}, j{0}; i < len * width; i++)
    {
        r_ptr[i] = inputImagePixels[j++];
        g_ptr[i] = inputImagePixels[j++];
        b_ptr[i] = inputImagePixels[j++];
        j++;
    }

    size_t nrow = len;
    size_t ncol = width;
    MyMatrix img_r = Eigen::Map<MyMatrix>(r_ptr, nrow, ncol);

    MyMatrix img_g = Eigen::Map<MyMatrix>(g_ptr, nrow, ncol);
    MyMatrix img_b = Eigen::Map<MyMatrix>(b_ptr, nrow, ncol);
    printf("Eigen Matrices created\n");

    int rank = 0;
    long long size = len * width * 4;
    // offset denotes the location in memory where the output image is to be written
    // after each iteration the offset would get incremented by the size of image in bytes
    long long offset = 0;
    // temporary vector to hold future values of async functions- this is done to remove blocking behaviour
    std::vector<std::future<void>> temp_future_vector;
    // Creating separate threads for each rank computation

    for (int cur = 0; cur < ranks.size(); cur++)
    {

        rank = ranks[cur];
        // printf("ok idx:%d rank:%d  offset:%lld \n", cur, rank, offset);
        uintptr_t outputimageBuffer = imageBufferStart + offset;

        temp_future_vector.emplace_back(std::async(std::launch::async, compress, rank, std::ref(img_r), std::ref(img_g), std::ref(img_b), outputimageBuffer));

        offset += size;
    }
    // free the memory to prevent memory leaks
    delete[] r_ptr;
    delete[] g_ptr;
    delete[] b_ptr;

    // auto end = std::chrono::steady_clock::now();

    // printf("Time taken by C++  %lld ms\n", std::chrono::duration_cast<std::chrono::milliseconds>(end - start).count());
}

EMSCRIPTEN_BINDINGS(my_module)
{
    register_vector<int>("VectorInt");
    register_vector<double>("VectorDouble");
    register_vector<std::vector<int>>("VectorVectorInt");
    function("run", &run);
}